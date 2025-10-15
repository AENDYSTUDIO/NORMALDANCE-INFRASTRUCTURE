import { Test, TestResult, UserProfile } from "@/types/test-system";

/**
 * Интерфейс для интеграции с LMS (Learning Management System)
 * Поддерживает основные LMS платформы: Moodle, Canvas, Blackboard и др.
 */
export class LMSIntegration {
  private lmsConfig: LMSConfig;

  constructor(config: LMSConfig) {
    this.lmsConfig = config;
  }

  /**
   * Отправка результата теста в LMS
   */
  async sendTestResultToLMS(testResult: TestResult): Promise<boolean> {
    try {
      switch (this.lmsConfig.platform) {
        case "moodle":
          return await this.sendToMoodle(testResult);
        case "canvas":
          return await this.sendToCanvas(testResult);
        case "blackboard":
          return await this.sendToBlackboard(testResult);
        case "google-classroom":
          return await this.sendToGoogleClassroom(testResult);
        default:
          throw new Error(
            `Неподдерживаемая платформа LMS: ${this.lmsConfig.platform}`
          );
      }
    } catch (error) {
      console.error("Ошибка при отправке результата в LMS:", error);
      return false;
    }
  }

  /**
   * Получение тестов из LMS
   */
  async getTestsFromLMS(userId: string): Promise<Test[]> {
    try {
      switch (this.lmsConfig.platform) {
        case "moodle":
          return await this.getTestsFromMoodle(userId);
        case "canvas":
          return await this.getTestsFromCanvas(userId);
        case "blackboard":
          return await this.getTestsFromBlackboard(userId);
        case "google-classroom":
          return await this.getTestsFromGoogleClassroom(userId);
        default:
          throw new Error(
            `Неподдерживаемая платформа LMS: ${this.lmsConfig.platform}`
          );
      }
    } catch (error) {
      console.error("Ошибка при получении тестов из LMS:", error);
      return [];
    }
  }

  /**
   * Синхронизация профиля пользователя с LMS
   */
  async syncUserProfile(userProfile: UserProfile): Promise<UserProfile> {
    try {
      switch (this.lmsConfig.platform) {
        case "moodle":
          return await this.syncProfileWithMoodle(userProfile);
        case "canvas":
          return await this.syncProfileWithCanvas(userProfile);
        case "blackboard":
          return await this.syncProfileWithBlackboard(userProfile);
        case "google-classroom":
          return await this.syncProfileWithGoogleClassroom(userProfile);
        default:
          throw new Error(
            `Неподдерживаемая платформа LMS: ${this.lmsConfig.platform}`
          );
      }
    } catch (error) {
      console.error("Ошибка при синхронизации профиля с LMS:", error);
      return userProfile;
    }
  }

  /**
   * Отправка в Moodle
   */
  private async sendToMoodle(testResult: TestResult): Promise<boolean> {
    // Moodle использует REST API или Web Services
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/webservice/rest/server.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          wstoken: this.lmsConfig.credentials.token,
          wsfunction: "local_tests_send_result",
          moodlewsrestformat: "json",
          userid: testResult.userId,
          testid: testResult.testId,
          score: testResult.percentage.toString(),
          maxscore: "100",
          dategraded: testResult.completedAt.toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success === true;
  }

  /**
   * Получение тестов из Moodle
   */
  private async getTestsFromMoodle(userId: string): Promise<Test[]> {
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/webservice/rest/server.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          wstoken: this.lmsConfig.credentials.token,
          wsfunction: "local_tests_get_user_tests",
          moodlewsrestformat: "json",
          userid: userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Преобразование данных Moodle в формат нашей системы
    return (
      data.tests?.map((moodleTest: Record<string, unknown>) =>
        this.mapMoodleTestToSystemTest(moodleTest)
      ) || []
    );
  }

  /**
   * Синхронизация профиля с Moodle
   */
  private async syncProfileWithMoodle(
    userProfile: UserProfile
  ): Promise<UserProfile> {
    // Получение дополнительной информации из Moodle
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/webservice/rest/server.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          wstoken: this.lmsConfig.credentials.token,
          wsfunction: "core_user_get_users",
          moodlewsrestformat: "json",
          "criteria[0][key]": "id",
          "criteria[0][value]": userProfile.id,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.users && data.users.length > 0) {
      const moodleUser = data.users[0];

      return {
        ...userProfile,
        name: moodleUser.fullname || userProfile.name,
        email: moodleUser.email || userProfile.email,
        // Добавление информации из LMS в профиль
        skills: [
          ...new Set([
            ...userProfile.skills,
            ...this.extractSkillsFromMoodleProfile(moodleUser),
          ]),
        ],
      };
    }

    return userProfile;
  }

  /**
   * Отправка в Canvas
   */
  private async sendToCanvas(testResult: TestResult): Promise<boolean> {
    // Canvas использует REST API
    const courseId = this.lmsConfig.settings?.courseId || "1";
    const assignmentId =
      this.lmsConfig.settings?.assignmentId || testResult.testId;

    const response = await fetch(
      `${this.lmsConfig.baseUrl}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission: {
            user_id: testResult.userId,
            submission_type: "online_text_entry",
            body: `Тест "${testResult.testName}" завершен. Результат: ${testResult.percentage}%`,
            posted_at: testResult.completedAt.toISOString(),
          },
          grade: testResult.percentage,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }

  /**
   * Получение тестов из Canvas
   */
  private async getTestsFromCanvas(userId: string): Promise<Test[]> {
    const courseId = this.lmsConfig.settings?.courseId || "1";

    const response = await fetch(
      `${this.lmsConfig.baseUrl}/api/v1/courses/${courseId}/assignments`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const assignments = await response.json();

    // Фильтрация заданий, которые являются тестами
    const testAssignments = assignments.filter(
      (assignment: Record<string, unknown>) =>
        assignment.description?.toLowerCase().includes("test") ||
        assignment.name?.toLowerCase().includes("quiz")
    );

    return testAssignments.map((assignment: Record<string, unknown>) =>
      this.mapCanvasAssignmentToSystemTest(assignment)
    );
  }

  /**
   * Синхронизация профиля с Canvas
   */
  private async syncProfileWithCanvas(
    userProfile: UserProfile
  ): Promise<UserProfile> {
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/api/v1/users/${userProfile.id}?include[]=enrollments`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const canvasUser = await response.json();

    return {
      ...userProfile,
      name: canvasUser.name || userProfile.name,
      email: canvasUser.email || userProfile.email,
    };
  }

  /**
   * Отправка в Blackboard
   */
  private async sendToBlackboard(testResult: TestResult): Promise<boolean> {
    // Blackboard использует REST API
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/learn/api/public/v1/users/${testResult.userId}/courses/${this.lmsConfig.settings?.courseId}/gradebook/columns/${this.lmsConfig.settings?.gradeColumnId}/results`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: testResult.userId,
          score: testResult.percentage,
          attemptStatus: "Completed",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }

  /**
   * Получение тестов из Blackboard
   */
  private async getTestsFromBlackboard(userId: string): Promise<Test[]> {
    // Получение курсов пользователя
    const coursesResponse = await fetch(
      `${this.lmsConfig.baseUrl}/learn/api/public/v1/users/${userId}/courses`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!coursesResponse.ok) {
      throw new Error(`HTTP error! status: ${coursesResponse.status}`);
    }

    const coursesData = await coursesResponse.json();

    // Для каждого курса получаем тесты
    let allTests: Test[] = [];

    for (const course of coursesData.results || []) {
      const testsResponse = await fetch(
        `${this.lmsConfig.baseUrl}/learn/api/public/v1/courses/${course.id}/tests`,
        {
          headers: {
            Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
          },
        }
      );

      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        const courseTests =
          testsData.results?.map((test: Record<string, unknown>) =>
            this.mapBlackboardTestToSystemTest(test, course)
          ) || [];
        allTests = [...allTests, ...courseTests];
      }
    }

    return allTests;
  }

  /**
   * Синхронизация профиля с Blackboard
   */
  private async syncProfileWithBlackboard(
    userProfile: UserProfile
  ): Promise<UserProfile> {
    const response = await fetch(
      `${this.lmsConfig.baseUrl}/learn/api/public/v1/users/${userProfile.id}`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bbUser = await response.json();

    return {
      ...userProfile,
      name: bbUser.name || userProfile.name,
      email: bbUser.email || userProfile.email,
    };
  }

  /**
   * Отправка в Google Classroom
   */
  private async sendToGoogleClassroom(
    testResult: TestResult
  ): Promise<boolean> {
    // Google Classroom использует Google API
    const courseId = this.lmsConfig.settings?.courseId || "1";
    const courseWorkId =
      this.lmsConfig.settings?.assignmentId || testResult.testId;

    // В Google Classroom нет прямой поддержки оценок для опросов,
    // поэтому создаем задание и отправляем результат как отправку
    const response = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const submissions = await response.json();

    // Находим submission для текущего пользователя
    const userSubmission = submissions.studentSubmissions?.find(
      (sub: Record<string, unknown>) => sub.userId === testResult.userId
    );

    if (userSubmission) {
      // Обновляем оценку
      const updateResponse = await fetch(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${userSubmission.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedGrade: testResult.percentage,
            draftGrade: testResult.percentage,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`HTTP error! status: ${updateResponse.status}`);
      }

      return true;
    }

    return false;
  }

  /**
   * Получение тестов из Google Classroom
   */
  private async getTestsFromGoogleClassroom(userId: string): Promise<Test[]> {
    const response = await fetch(
      `https://classroom.googleapis.com/v1/courses/${this.lmsConfig.settings?.courseId}/courseWork`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courseWorkData = await response.json();

    // Фильтрация заданий, которые являются тестами/опросами
    const testCourseWork =
      courseWorkData.courseWork?.filter(
        (cw: Record<string, unknown>) =>
          cw.workType === "QUIZ" || cw.title?.toLowerCase().includes("test")
      ) || [];

    return testCourseWork.map((cw: Record<string, unknown>) =>
      this.mapGoogleClassroomWorkToSystemTest(cw)
    );
  }

  /**
   * Синхронизация профиля с Google Classroom
   */
  private async syncProfileWithGoogleClassroom(
    userProfile: UserProfile
  ): Promise<UserProfile> {
    const response = await fetch(
      `https://classroom.googleapis.com/v1/users/${userProfile.id}`,
      {
        headers: {
          Authorization: `Bearer ${this.lmsConfig.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const gcUser = await response.json();

    return {
      ...userProfile,
      name: gcUser.profile?.name?.fullName || userProfile.name,
      email: gcUser.profile?.emailAddress || userProfile.email,
    };
  }

  /**
   * Преобразование теста Moodle в формат нашей системы
   */
  private mapMoodleTestToSystemTest(moodleTest: Record<string, unknown>): Test {
    return {
      id: moodleTest.id || `moodle_${Date.now()}`,
      title: moodleTest.name || moodleTest.title || "Тест из Moodle",
      description: moodleTest.intro || moodleTest.description || "",
      questions: [], // В реальной интеграции здесь будут вопросы из Moodle
      totalPoints: moodleTest.maxgrade || 100,
      timeLimit: moodleTest.timelimit,
      difficulty: this.estimateDifficultyFromMoodle(moodleTest),
      category: moodleTest.course || "Moodle",
      tags: moodleTest.tags || [],
      createdAt: new Date(moodleTest.timecreated * 100) || new Date(),
      updatedAt: new Date(moodleTest.timemodified * 1000) || new Date(),
      author: moodleTest.createdby || "system",
      isActive: moodleTest.visible !== 0,
      isAdaptive: false,
      randomizeQuestions: moodleTest.shuffleanswers === 1,
      randomizeOptions: moodleTest.shuffleanswers === 1,
    };
  }

  /**
   * Преобразование задания Canvas в формат нашей системы
   */
  private mapCanvasAssignmentToSystemTest(canvasAssignment: Record<string, unknown>): Test {
    return {
      id: canvasAssignment.id || `canvas_${Date.now()}`,
      title: canvasAssignment.name || "Тест из Canvas",
      description: canvasAssignment.description || "",
      questions: [], // В реальной интеграции здесь будут вопросы из Canvas
      totalPoints: canvasAssignment.points_possible || 100,
      timeLimit: canvasAssignment.time_limit || undefined,
      difficulty: this.estimateDifficultyFromCanvas(canvasAssignment),
      category: canvasAssignment.course_id || "Canvas",
      tags: canvasAssignment.tag_list || [],
      createdAt: new Date(canvasAssignment.created_at) || new Date(),
      updatedAt: new Date(canvasAssignment.updated_at) || new Date(),
      author: canvasAssignment.creator_id || "system",
      isActive: canvasAssignment.published === true,
      isAdaptive: false,
      randomizeQuestions: false, // Canvas может иметь свои настройки рандомизации
      randomizeOptions: false,
    };
  }

  /**
   * Преобразование теста Blackboard в формат нашей системы
   */
  private mapBlackboardTestToSystemTest(bbTest: Record<string, unknown>, course: Record<string, unknown>): Test {
    return {
      id: bbTest.id || `blackboard_${Date.now()}`,
      title: bbTest.name || "Тест из Blackboard",
      description: bbTest.description || "",
      questions: [], // В реальной интеграции здесь будут вопросы из Blackboard
      totalPoints: bbTest.totalPoints || 100,
      timeLimit: bbTest.timeLimit || undefined,
      difficulty: this.estimateDifficultyFromBlackboard(bbTest),
      category: course.name || "Blackboard",
      tags: bbTest.categories || [],
      createdAt: new Date(bbTest.created) || new Date(),
      updatedAt: new Date(bbTest.modified) || new Date(),
      author: bbTest.createdBy || "system",
      isActive: bbTest.availability?.available === "Yes",
      isAdaptive: false,
      randomizeQuestions: bbTest.randomBlocks || false,
      randomizeOptions: bbTest.randomBlocks || false,
    };
  }

  /**
   * Преобразование задания Google Classroom в формат нашей системы
   */
  private mapGoogleClassroomWorkToSystemTest(gcWork: Record<string, unknown>): Test {
    return {
      id: gcWork.id || `gc_${Date.now()}`,
      title: gcWork.title || "Тест из Google Classroom",
      description: gcWork.description || "",
      questions: [], // В реальной интеграции здесь будут вопросы из Google Classroom
      totalPoints: gcWork.maxPoints || 100,
      timeLimit: gcWork.dueDate ? this.calculateTimeLimit(gcWork) : undefined,
      difficulty: this.estimateDifficultyFromGoogleClassroom(gcWork),
      category: gcWork.courseId || "Google Classroom",
      tags: gcWork.topicId ? [gcWork.topicId] : [],
      createdAt: new Date(gcWork.creationTime) || new Date(),
      updatedAt: new Date(gcWork.updateTime) || new Date(),
      author: gcWork.creatorUserId || "system",
      isActive: gcWork.state === "PUBLISHED",
      isAdaptive: false,
      randomizeQuestions: false,
      randomizeOptions: false,
    };
  }

  /**
   * Извлечение навыков из профиля Moodle
   */
  private extractSkillsFromMoodleProfile(moodleUser: Record<string, unknown>): string[] {
    // В реальной системе это будет извлекаться из пользовательских полей, профиля курсов и т.д.
    const skills: string[] = [];

    if (moodleUser.customfields) {
      for (const field of moodleUser.customfields) {
        if (
          field.name.toLowerCase().includes("skill") ||
          field.name.toLowerCase().includes("competency")
        ) {
          skills.push(field.value);
        }
      }
    }

    return skills;
  }

  /**
   * Оценка сложности из Moodle
   */
  private estimateDifficultyFromMoodle(moodleTest: Record<string, unknown>): Record<string, unknown> {
    // Простая эвристика на основе максимального балла или других параметров
    if (moodleTest.maxgrade >= 90) return "expert";
    if (moodleTest.maxgrade >= 70) return "advanced";
    if (moodleTest.maxgrade >= 50) return "intermediate";
    return "beginner";
  }

  /**
   * Оценка сложности из Canvas
   */
  private estimateDifficultyFromCanvas(canvasAssignment: Record<string, unknown>): Record<string, unknown> {
    if (canvasAssignment.points_possible >= 90) return "expert";
    if (canvasAssignment.points_possible >= 70) return "advanced";
    if (canvasAssignment.points_possible >= 50) return "intermediate";
    return "beginner";
  }

  /**
   * Оценка сложности из Blackboard
   */
  private estimateDifficultyFromBlackboard(bbTest: Record<string, unknown>): Record<string, unknown> {
    if (bbTest.totalPoints >= 90) return "expert";
    if (bbTest.totalPoints >= 70) return "advanced";
    if (bbTest.totalPoints >= 50) return "intermediate";
    return "beginner";
  }

  /**
   * Оценка сложности из Google Classroom
   */
  private estimateDifficultyFromGoogleClassroom(gcWork: Record<string, unknown>): Record<string, unknown> {
    if (gcWork.maxPoints >= 90) return "expert";
    if (gcWork.maxPoints >= 70) return "advanced";
    if (gcWork.maxPoints >= 50) return "intermediate";
    return "beginner";
  }

  /**
   * Расчет ограничения по времени
   */
  private calculateTimeLimit(gcWork: Record<string, unknown>): number | undefined {
    if (gcWork.dueDate && gcWork.dueTime) {
      // В реальной системе это будет вычислено на основе дедлайна
      return undefined; // Google Classroom управляет временем по-своему
    }
    return undefined;
  }
}

/**
 * Конфигурация LMS
 */
export interface LMSConfig {
  platform: "moodle" | "canvas" | "blackboard" | "google-classroom";
  baseUrl: string;
  credentials: {
    token: string;
    username?: string;
    password?: string;
  };
  settings?: {
    courseId?: string;
    assignmentId?: string;
    gradeColumnId?: string;
    [key: string]: Record<string, unknown>;
  };
}
