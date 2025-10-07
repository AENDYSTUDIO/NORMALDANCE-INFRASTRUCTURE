"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Task, TaskPriority, TaskStatus } from "@/types/task-system";
import React, { useEffect, useState } from "react";

interface TaskManagerProps {
  userId: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Загрузка задач из localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks_${userId}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, [userId]);

  // Сохранение задач в localStorage
  useEffect(() => {
    localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks));
  }, [tasks, userId]);

  const addTask = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      status,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    };

    setTasks([...tasks, newTask]);
    resetForm();
  };

  const updateTask = () => {
    if (!editingTask || !title.trim()) return;

    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? {
            ...task,
            title,
            description,
            priority,
            status,
            category,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            updatedAt: new Date(),
          }
        : task
    );

    setTasks(updatedTasks);
    setEditingTask(null);
    resetForm();
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setStatus(task.status);
    setCategory(task.category || "");
    setDueDate(task.dueDate ? task.dueDate.toISOString().split("T")[0] : "");
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setCategory("");
    setDueDate("");
  };

  const cancelEdit = () => {
    setEditingTask(null);
    resetForm();
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filter === "ALL" || task.status === filter;
    const matchesPriority = priority === "ALL" || task.priority === priority;
    const matchesCategory = category === "ALL" || task.category === category;
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "DONE":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Task Manager</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Форма добавления/редактирования задачи */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название задачи</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название задачи"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK">Работа</SelectItem>
                  <SelectItem value="PERSONAL">Личное</SelectItem>
                  <SelectItem value="MUSIC">Музыка</SelectItem>
                  <SelectItem value="DEVELOPMENT">Разработка</SelectItem>
                  <SelectItem value="MARKETING">Маркетинг</SelectItem>
                  <SelectItem value="FINANCE">Финансы</SelectItem>
                  <SelectItem value="OTHER">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Приоритет</label>
              <Select
                value={priority}
                onValueChange={(value: TaskPriority) => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select
                value={status}
                onValueChange={(value: TaskStatus) => setStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">К выполнению</SelectItem>
                  <SelectItem value="IN_PROGRESS">В процессе</SelectItem>
                  <SelectItem value="DONE">Выполнено</SelectItem>
                  <SelectItem value="CANCELLED">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание задачи"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Срок выполнения</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex items-end space-x-2">
              {editingTask ? (
                <>
                  <Button onClick={updateTask} className="w-full">
                    Обновить задачу
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="w-full"
                  >
                    Отмена
                  </Button>
                </>
              ) : (
                <Button onClick={addTask} className="w-full">
                  Добавить задачу
                </Button>
              )}
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск задач..."
              />
            </div>
            <div>
              <Select
                value={filter}
                onValueChange={(value: TaskStatus | "ALL") => setFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все</SelectItem>
                  <SelectItem value="TODO">К выполнению</SelectItem>
                  <SelectItem value="IN_PROGRESS">В процессе</SelectItem>
                  <SelectItem value="DONE">Выполнено</SelectItem>
                  <SelectItem value="CANCELLED">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={priority}
                onValueChange={(value: TaskPriority) => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по приоритету" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все приоритеты</SelectItem>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все категории</SelectItem>
                  <SelectItem value="WORK">Работа</SelectItem>
                  <SelectItem value="PERSONAL">Личное</SelectItem>
                  <SelectItem value="MUSIC">Музыка</SelectItem>
                  <SelectItem value="DEVELOPMENT">Разработка</SelectItem>
                  <SelectItem value="MARKETING">Маркетинг</SelectItem>
                  <SelectItem value="FINANCE">Финансы</SelectItem>
                  <SelectItem value="OTHER">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Список задач */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Нет задач для отображения
              </p>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>

                        {task.category && (
                          <div className="mb-2">
                            <Badge variant="secondary">{task.category}</Badge>
                          </div>
                        )}

                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {task.description}
                          </p>
                        )}

                        {task.dueDate && (
                          <p className="text-sm text-gray-500">
                            Срок:{" "}
                            {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Создано:{" "}
                          {new Date(task.createdAt).toLocaleString("ru-RU")}
                          {task.updatedAt.getTime() !==
                            task.createdAt.getTime() &&
                            ` (обновлено: ${new Date(
                              task.updatedAt
                            ).toLocaleString("ru-RU")})`}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(task)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;
