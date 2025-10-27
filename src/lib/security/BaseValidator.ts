/**
 * BaseValidator — базовый класс валидации с поддержкой:
 * - generic-типов входа/выхода
 * - композиции правил (pipeline)
 * - нормализации входных данных
 * - агрегирования ошибок с кодами/сообщениями/путями
 * - ленивой (lazy) и жадной (greedy) проверки
 * - цепной конфигурации и переиспользования правил между модулями
 *
 * Все комментарии на русском языке. Совместим с типами ISecurityService.
 */

import {
  ErrorDetail,
  ResultErr,
  ResultOk,
  SecurityErrorCode,
  SecurityResult,
  ValidationOptions,
} from "./ISecurityService";

/**
 * Rule — функция-правило, преобразующая значение и возвращающая результат валидации/нормализации.
 * - При успехе возвращает { ok: true, value }
 * - При ошибке — { ok: false, errors }
 */
export type Rule<TIn, TOut> = (input: TIn) => SecurityResult<TOut>;

/**
 * Внутреннее представление шага пайплайна с именем (для диагностики).
 */
interface PipelineStep<TIn, TOut> {
  name?: string;
  fn: Rule<TIn, TOut>;
}

/**
 * Утилиты формирования результатов
 */
function ok<T>(value: T, warnings?: ErrorDetail[]): ResultOk<T> {
  return warnings && warnings.length > 0
    ? { ok: true, value, warnings }
    : { ok: true, value };
}

function err<T = never>(errors: ErrorDetail | ErrorDetail[]): ResultErr {
  const list = Array.isArray(errors) ? errors : [errors];
  return { ok: false, errors: list };
}

/**
 * Конструктор структурированных ошибок
 */
export function makeError(
  code: SecurityErrorCode,
  message: string,
  path?: string[],
  meta?: Record<string, unknown>
): ErrorDetail {
  return { code, message, path, meta };
}

/**
 * BaseValidator — универсальный валидатор/нормализатор данных.
 * В типах:
 * - TInput — тип входных данных после (опц.) нормализации
 * - TOutput — тип результата после выполнения всех правил
 */
export class BaseValidator<TInput, TOutput> {
  private readonly name?: string;
  private normalizer?: (raw: unknown) => TInput;
  private readonly steps: PipelineStep<any, any>[] = [];
  private defaultOptions: Required<
    Pick<ValidationOptions, "greedy" | "lazy" | "normalize">
  > = {
    greedy: true,
    lazy: false,
    normalize: true,
  };

  /**
   * @param name Человекочитаемое имя валидатора (для логирования/диагностики)
   */
  constructor(name?: string) {
    this.name = name;
  }

  /**
   * Установить функцию нормализации необработанного ввода.
   * @param fn Функция нормализации unknown -> TInput
   */
  normalize(fn: (raw: unknown) => TInput): this {
    this.normalizer = fn;
    return this;
  }

  /**
   * Добавить правило в цепочку.
   * @param fn Функция-правило
   * @param name Необязательное имя шага
   */
  rule<TNext>(
    fn: Rule<TInput extends never ? unknown : any, TNext>,
    name?: string
  ): BaseValidator<TNext, TOutput> {
    this.steps.push({ name, fn });
    // Трюк с типами: каждый следующий шаг принимает выход предыдущего
    return this as unknown as BaseValidator<TNext, TOutput>;
  }

  /**
   * Добавить преобразование значения (map) c автоматической упаковкой в ok/err.
   * Ошибки из преобразования следует бросать как Error или возвращать err через makeError.
   */
  map<TNext>(
    mapper: (value: TInput) => TNext,
    name = "map"
  ): BaseValidator<TNext, TOutput> {
    const wrap: Rule<TInput, TNext> = (value) => {
      try {
        const next = mapper(value);
        return ok(next);
      } catch (e: any) {
        return err(
          makeError(
            SecurityErrorCode.VALIDATION_ERROR,
            e?.message ?? "Mapping failed",
            undefined,
            { cause: e ? String(e) : "unknown" }
          )
        );
      }
    };
    this.steps.push({ name, fn: wrap });
    return this as unknown as BaseValidator<TNext, TOutput>;
  }

  /**
   * Установить дефолтный режим жадной проверки (сбор всех ошибок).
   */
  greedy(): this {
    this.defaultOptions.greedy = true;
    this.defaultOptions.lazy = false;
    return this;
  }

  /**
   * Установить дефолтный режим ленивой проверки (выход при первой ошибке).
   */
  lazy(): this {
    this.defaultOptions.greedy = false;
    this.defaultOptions.lazy = true;
    return this;
  }

  /**
   * Выполнить валидацию/нормализацию.
   * @param input Входные данные (unknown)
   * @param options Параметры: greedy/lazy/normalize
   * @returns SecurityResult<TOutput>
   */
  validate(
    input: unknown,
    options?: ValidationOptions
  ): SecurityResult<TOutput> {
    const opts = this.mergeOptions(options);

    // 1) Нормализация
    let value: any;
    try {
      value =
        opts.normalize && this.normalizer
          ? this.normalizer(input)
          : (input as TInput);
    } catch (e: any) {
      return err(
        makeError(
          SecurityErrorCode.VALIDATION_ERROR,
          "Normalization failed",
          undefined,
          { cause: e ? String(e) : "unknown" }
        )
      );
    }

    // 2) Прогон через pipeline
    const collectedErrors: ErrorDetail[] = [];
    const collectedWarnings: ErrorDetail[] = [];

    for (const step of this.steps) {
      const res = step.fn(value);
      if (res.ok) {
        value = res.value;
        if (res.warnings && res.warnings.length > 0) {
          collectedWarnings.push(...res.warnings);
        }
      } else {
        // Ошибки шага
        const tagged = res.errors.map((e) => this.tagError(e, step.name));
        if (opts.lazy) {
          return err(tagged);
        }
        collectedErrors.push(...tagged);
        // В жадном режиме продолжаем, чтобы собрать все ошибки
      }
    }

    if (collectedErrors.length > 0) {
      return err(collectedErrors);
    }

    return ok(
      value as TOutput,
      collectedWarnings.length > 0 ? collectedWarnings : undefined
    );
  }

  /**
   * Переиспользование: собрать правило из внешнего валидатора как единый шаг.
   * Удобно для композиции модулей (наследование не требуется).
   */
  asRule(name?: string): Rule<unknown, TOutput> {
    return (input: unknown) =>
      this.validate(input, { greedy: true, normalize: true, lazy: false });
  }

  /**
   * Вспомогательный метод для добавления информации о шаге в ошибку.
   */
  private tagError(e: ErrorDetail, stepName?: string): ErrorDetail {
    if (!stepName) return e;
    return {
      ...e,
      meta: { ...(e.meta || {}), step: stepName, validator: this.name },
    };
  }

  /**
   * Объединение дефолтных опций и пользовательских.
   */
  private mergeOptions(
    options?: ValidationOptions
  ): Required<Pick<ValidationOptions, "greedy" | "lazy" | "normalize">> {
    return {
      greedy: options?.greedy ?? this.defaultOptions.greedy,
      lazy: options?.lazy ?? this.defaultOptions.lazy,
      normalize: options?.normalize ?? this.defaultOptions.normalize,
    };
  }

  // ---------- Статические утилиты для разработчиков правил ----------

  /**
   * Создать успешный результат (ok).
   */
  static ok<T>(value: T, warnings?: ErrorDetail[]): ResultOk<T> {
    return ok(value, warnings);
  }

  /**
   * Создать ошибочный результат (err).
   */
  static err(errors: ErrorDetail | ErrorDetail[]): ResultErr {
    return err(errors);
  }

  /**
   * Утилита для построения ошибки с кодом/сообщением/путем/метаданными.
   */
  static error(
    code: SecurityErrorCode,
    message: string,
    path?: string[],
    meta?: Record<string, unknown>
  ): ErrorDetail {
    return makeError(code, message, path, meta);
  }

  /**
   * Объединить результаты нескольких правил.
   * Возвращает первую ошибку в ленивом стиле либо аккумулирует ошибки в жадном режиме.
   */
  static merge<T>(
    results: SecurityResult<T>[],
    greedy = true
  ): SecurityResult<T[]> {
    const values: T[] = [];
    const warnings: ErrorDetail[] = [];
    const errors: ErrorDetail[] = [];

    for (const r of results) {
      if (r.ok) {
        values.push(r.value);
        if (r.warnings && r.warnings.length > 0) warnings.push(...r.warnings);
      } else {
        if (!greedy) return err(r.errors);
        errors.push(...r.errors);
      }
    }

    if (errors.length > 0) return err(errors);
    return ok(values, warnings.length > 0 ? warnings : undefined);
  }
}

export default BaseValidator;
