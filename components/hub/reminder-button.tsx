"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, CalendarPlus, Loader2 } from "lucide-react"

interface Reminder {
  id: string
  title: string
  description?: string
  remindAt: string
  notifyMethod: string
  reminder24h?: boolean
  reminder1h?: boolean
  calendarEventId?: string
}

interface ReminderButtonProps {
  entityType: string
  entityId: string
  title: string
  description?: string
  defaultRemindAt?: Date
  onReminderCreated?: (reminder: Reminder) => void
  onReminderDeleted?: () => void
}

export function ReminderButton({
  entityType,
  entityId,
  title,
  description,
  defaultRemindAt,
  onReminderCreated,
  onReminderDeleted,
}: ReminderButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasReminder, setHasReminder] = useState(false)
  const [remindAt, setRemindAt] = useState(
    defaultRemindAt
      ? new Date(defaultRemindAt.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      : ""
  )
  const [notes, setNotes] = useState("")
  const [addToCalendar, setAddToCalendar] = useState(true)
  const [reminder24h, setReminder24h] = useState(false)
  const [reminder1h, setReminder1h] = useState(false)

  // 既存のリマインダーを確認
  useEffect(() => {
    const checkReminder = async () => {
      try {
        const res = await fetch(
          `/api/hub/reminders?targetEntityType=${entityType}&targetEntityId=${entityId}`
        )
        const data = await res.json()
        setHasReminder(data.reminders && data.reminders.length > 0)
      } catch (error) {
        console.error("Error checking reminder:", error)
      }
    }
    checkReminder()
  }, [entityType, entityId])

  const handleCreate = async () => {
    if (!remindAt) {
      alert("通知日時を設定してください")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/hub/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEntityType: entityType,
          targetEntityId: entityId,
          title,
          description: notes || description,
          remindAt: new Date(remindAt),
          notifyMethod: "app",
          addToCalendar,
          reminder24h,
          reminder1h,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setHasReminder(true)
        setOpen(false)

        if (data.reminder?.calendarEvent) {
          alert("リマインダーを設定し、Googleカレンダーにも追加しました！")

          // カレンダーを別タブで開く
          if (data.reminder.calendarEvent.htmlLink) {
            window.open(data.reminder.calendarEvent.htmlLink, "_blank")
          }
        } else {
          alert("リマインダーを設定しました")
        }

        onReminderCreated?.(data.reminder)
      } else {
        alert(data.error || "リマインダーの設定に失敗しました")
      }
    } catch (error) {
      console.error("Error creating reminder:", error)
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("リマインダーを削除しますか？")) {
      return
    }

    setLoading(true)

    try {
      // まずリマインダーIDを取得
      const res = await fetch(
        `/api/hub/reminders?targetEntityType=${entityType}&targetEntityId=${entityId}`
      )
      const data = await res.json()

      if (data.reminders && data.reminders.length > 0) {
        const reminderId = data.reminders[0].id

        const deleteRes = await fetch(`/api/hub/reminders?id=${reminderId}`, {
          method: "DELETE",
        })

        if (deleteRes.ok) {
          setHasReminder(false)
          setOpen(false)
          alert("リマインダーを削除しました")
          onReminderDeleted?.()
        }
      }
    } catch (error) {
      console.error("Error deleting reminder:", error)
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasReminder ? "default" : "outline"}
          size="sm"
          className={hasReminder ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          onClick={() => console.log("Reminder button clicked!", { entityType, entityId, title })}
        >
          {hasReminder ? <Bell className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
          {hasReminder ? "通知済" : "リマインダー"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>リマインダー設定</DialogTitle>
          <DialogDescription>
            {title}の通知日時を設定します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="remindAt">通知日時</Label>
            <Input
              id="remindAt"
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm">追加の通知タイミング（任意）</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder24h"
                  checked={reminder24h}
                  onCheckedChange={(checked) => setReminder24h(checked as boolean)}
                />
                <Label htmlFor="reminder24h" className="text-sm cursor-pointer">
                  24時間前に通知
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder1h"
                  checked={reminder1h}
                  onCheckedChange={(checked) => setReminder1h(checked as boolean)}
                />
                <Label htmlFor="reminder1h" className="text-sm cursor-pointer">
                  1時間前に通知
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">メモ（任意）</Label>
            <Textarea
              id="notes"
              placeholder="追加のメモを入力..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="calendar"
              checked={addToCalendar}
              onCheckedChange={(checked) => setAddToCalendar(checked as boolean)}
            />
            <Label htmlFor="calendar" className="text-sm cursor-pointer">
              Googleカレンダーにも追加
            </Label>
          </div>
        </div>
        <DialogFooter>
          {hasReminder ? (
            <>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                削除
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !remindAt}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                設定
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
