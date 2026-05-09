// Google Tasks API クライアント
// タスクをGoogle Tasksと同期

const TASKS_API_BASE = "https://tasks.googleapis.com/tasks/v1"

export interface GoogleTask {
  id?: string
  title: string
  notes?: string
  due?: string // ISO 8601形式
  status?: "needsAction" | "completed"
  completed?: string // 完了日時（ISO 8601形式）
}

/**
 * Google Tasksのタスクリストを取得
 */
export async function getTaskLists(accessToken: string): Promise<
  Array<{
    id: string
    title: string
    kind: string
  }>
> {
  try {
    const response = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tasks API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error fetching task lists:", error)
    throw error
  }
}

/**
 * 特定のタスクリストのタスクを取得
 */
export async function getTasks(accessToken: string, tasklistId: string): Promise<GoogleTask[]> {
  try {
    const response = await fetch(
      `${TASKS_API_BASE}/lists/${tasklistId}/tasks?showCompleted=false&showHidden=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tasks API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }
}

/**
 * Google Tasksにタスクを追加
 */
export async function insertTask(
  accessToken: string,
  tasklistId: string,
  task: GoogleTask
): Promise<GoogleTask> {
  try {
    const response = await fetch(`${TASKS_API_BASE}/lists/${tasklistId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: task.title,
        notes: task.notes,
        due: task.due,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tasks API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error inserting task:", error)
    throw error
  }
}

/**
 * Google Tasksのタスクを更新
 */
export async function updateTask(
  accessToken: string,
  tasklistId: string,
  taskId: string,
  task: GoogleTask
): Promise<GoogleTask> {
  try {
    const response = await fetch(
      `${TASKS_API_BASE}/lists/${tasklistId}/tasks/${taskId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status || "needsAction",
          ...(task.status === "completed" && {
            completed: task.completed || new Date().toISOString(),
          }),
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tasks API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

/**
 * Google Tasksのタスクを削除
 */
export async function deleteTask(
  accessToken: string,
  tasklistId: string,
  taskId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${TASKS_API_BASE}/lists/${tasklistId}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text()
      throw new Error(`Tasks API error: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

/**
 * サイトのタスクをGoogle Tasks形式に変換
 */
export function taskToGoogleTask(task: {
  title: string
  description?: string | null
  dueDate?: Date | null
}): GoogleTask {
  return {
    title: task.title,
    notes: task.description || undefined,
    due: task.dueDate ? task.dueDate.toISOString().split("T")[0] : undefined,
    status: "needsAction",
  }
}

/**
 * Google Tasksをサイトのタスク形式に変換
 */
export function googleTaskToTask(googleTask: GoogleTask): {
  title: string
  description?: string
  dueDate?: Date
  completed?: boolean
} {
  return {
    title: googleTask.title,
    description: googleTask.notes,
    dueDate: googleTask.due ? new Date(googleTask.due) : undefined,
    completed: googleTask.status === "completed",
  }
}
