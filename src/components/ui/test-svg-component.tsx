"use client";

import { HomeIcon, PanelLeftIcon, UserIcon } from "lucide-react";
import * as React from "react";

// Создаем обертку для иконок с фиксированными атрибутами
const FixedSvgIcon = ({
  icon: Icon,
  className,
  ...props
}: {
  icon: React.ComponentType<any>;
  className?: string;
  [key: string]: any;
}) => {
  // Удаляем все атрибуты, которые могут быть добавлены расширениями
  const fixedProps = {
    ...props,
    className: className || props.className,
    // Убираем потенциально проблемные атрибуты
    style: props.style || {},
    "data-darkreader-inline-stroke": undefined,
    "data-darkreader-inline-fill": undefined,
    "--darkreader-inline-stroke": undefined,
    "--darkreader-inline-fill": undefined,
  };

  return <Icon {...fixedProps} />;
};

export function TestSvgComponent() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Возвращаем пустой элемент до монтирования для избежания диспаритета
    return null;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Test SVG Icons</h2>
      <div className="flex gap-4">
        <FixedSvgIcon icon={PanelLeftIcon} className="w-6 h-6" />
        <FixedSvgIcon icon={HomeIcon} className="w-6 h-6" />
        <FixedSvgIcon icon={UserIcon} className="w-6 h-6" />
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Testing SVG attributes stability</p>
      </div>
    </div>
  );
}
