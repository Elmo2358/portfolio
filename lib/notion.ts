// Notion API クライアント
// タスクをNotionデータベースと同期

const NOTION_API_BASE = "https://api.notion.com/v1"

export interface NotionDatabase {
  id: string
  title: string
  description?: string
}

export interface NotionPage {
  id: string
  properties: Record<string, any>
}

export interface NotionTask {
  id?: string
  title: string
  status?: string
  dueDate?: string
  description?: string
}

/**
 * Notionのデータベース一覧を取得
 */
export async function getDatabases(accessToken: string): Promise<NotionDatabase[]> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          value: "database",
          property: "object",
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return (data.results || []).map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
      description: db.description?.[0]?.plain_text,
    }))
  } catch (error) {
    console.error("Error fetching Notion databases:", error)
    throw error
  }
}

/**
 * データベースのスキーマを取得
 */
export async function getDatabaseSchema(
  accessToken: string,
  databaseId: string
): Promise<any> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching database schema:", error)
    throw error
  }
}

/**
 * Notionにタスクを追加
 */
export async function createPage(
  accessToken: string,
  databaseId: string,
  task: NotionTask,
  propertyMapping: {
    titleProperty: string
    statusProperty?: string
    dateProperty?: string
    descriptionProperty?: string
  }
): Promise<NotionPage> {
  try {
    const properties: any = {}

    // タイトルプロパティ
    properties[propertyMapping.titleProperty] = {
      title: [
        {
          text: {
            content: task.title,
          },
        },
      ],
    }

    // ステータスプロパティ
    if (propertyMapping.statusProperty && task.status) {
      properties[propertyMapping.statusProperty] = {
        select: {
          name: task.status,
        },
      }
    }

    // 日付プロパティ
    if (propertyMapping.dateProperty && task.dueDate) {
      properties[propertyMapping.dateProperty] = {
        date: {
          start: task.dueDate,
        },
      }
    }

    // 説明プロパティ（テキスト）
    if (propertyMapping.descriptionProperty && task.description) {
      properties[propertyMapping.descriptionProperty] = {
        rich_text: [
          {
            text: {
              content: task.description,
            },
          },
        ],
      }
    }

    const response = await fetch(`${NOTION_API_BASE}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating Notion page:", error)
    throw error
  }
}

/**
 * Notionのページを更新
 */
export async function updatePage(
  accessToken: string,
  pageId: string,
  task: Partial<NotionTask>,
  propertyMapping: {
    titleProperty?: string
    statusProperty?: string
    dateProperty?: string
    descriptionProperty?: string
  }
): Promise<NotionPage> {
  try {
    const properties: any = {}

    if (propertyMapping.titleProperty && task.title) {
      properties[propertyMapping.titleProperty] = {
        title: [
          {
            text: {
              content: task.title,
            },
          },
        ],
      }
    }

    if (propertyMapping.statusProperty && task.status) {
      properties[propertyMapping.statusProperty] = {
        select: {
          name: task.status,
        },
      }
    }

    if (propertyMapping.dateProperty && task.dueDate) {
      properties[propertyMapping.dateProperty] = {
        date: {
          start: task.dueDate,
        },
      }
    }

    if (propertyMapping.descriptionProperty && task.description) {
      properties[propertyMapping.descriptionProperty] = {
        rich_text: [
          {
            text: {
              content: task.description,
            },
          },
        ],
      }
    }

    const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating Notion page:", error)
    throw error
  }
}

/**
 * データベースのページを取得
 */
export async function queryDatabase(
  accessToken: string,
  databaseId: string
): Promise<NotionPage[]> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error querying Notion database:", error)
    throw error
  }
}

/**
 * サイトのタスクをNotion形式に変換
 */
export function taskToNotionTask(task: {
  title: string
  description?: string | null
  dueDate?: Date | null
  status: string
}): NotionTask {
  return {
    title: task.title,
    description: task.description || undefined,
    dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : undefined,
    status: task.status === "completed" ? "完了" : task.status === "in_progress" ? "進行中" : "未着手",
  }
}

/**
 * Notionページをサイトのタスク形式に変換
 */
export function notionPageToTask(
  page: NotionPage,
  propertyMapping: {
    titleProperty: string
    statusProperty?: string
    dateProperty?: string
    descriptionProperty?: string
  }
): {
  title: string
  description?: string
  dueDate?: Date
  status: string
} {
  const titleProp = page.properties[propertyMapping.titleProperty]
  const title = titleProp?.title?.[0]?.text?.content || "Untitled"

  let status = "todo"
  if (propertyMapping.statusProperty) {
    const statusProp = page.properties[propertyMapping.statusProperty]
    const statusValue = statusProp?.select?.name
    if (statusValue === "完了" || statusValue === "Done" || statusValue === "Completed") {
      status = "completed"
    } else if (statusValue === "進行中" || statusValue === "In Progress") {
      status = "in_progress"
    }
  }

  let dueDate: Date | undefined
  if (propertyMapping.dateProperty) {
    const dateProp = page.properties[propertyMapping.dateProperty]
    const dateValue = dateProp?.date?.start
    if (dateValue) {
      dueDate = new Date(dateValue)
    }
  }

  let description: string | undefined
  if (propertyMapping.descriptionProperty) {
    const descProp = page.properties[propertyMapping.descriptionProperty]
    description = descProp?.rich_text?.[0]?.text?.content
  }

  return { title, description, dueDate, status }
}
