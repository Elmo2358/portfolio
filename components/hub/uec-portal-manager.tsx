"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  ExternalLink,
  Bell,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Terminal,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UecNotice {
  id: string;
  title: string;
  date?: string;
  publisher?: string;
  category?: string;
  href?: string;
  unread: boolean;
  detailHtml?: string | null;
  detailText?: string | null;
}

interface UecScheduleEntry {
  id: string;
  dateLabel: string;
  weekday: string;
  time?: string;
  title: string;
}

interface UecTimetableEntry {
  id: string;
  day: string;
  period: string;
  title: string;
  courseCode?: string;
  room?: string;
}

interface UecStatus {
  enabled: boolean;
  dataDir?: string | null;
  lastSync: string | null;
  lastSyncStatus: string | null;
  counts: {
    notices: number;
    schedule: number;
    timetable: number;
  };
}

export function UecPortalManager() {
  const router = useRouter();
  const [notices, setNotices] = useState<UecNotice[]>([]);
  const [schedule, setSchedule] = useState<UecScheduleEntry[]>([]);
  const [timetable, setTimetable] = useState<UecTimetableEntry[]>([]);
  const [status, setStatus] = useState<UecStatus | null>(null);
  const [sessionStatus, setSessionStatus] = useState<{ isLoggedIn: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showLoginHelp, setShowLoginHelp] = useState(false);
  const [expandedNotices, setExpandedNotices] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["all"]));
  const [viewMode, setViewMode] = useState<"category" | "list">("category");

  useEffect(() => {
    fetchSessionStatus();
    fetchStatus();
    fetchData();

    const interval = setInterval(fetchSessionStatus, 5000);
    return () => clearInterval(interval);
  }, [unreadOnly]);

  async function fetchSessionStatus() {
    try {
      const res = await fetch("/api/hub/uec/login");
      const data = await res.json();
      if (data.success) {
        setSessionStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch session status:", err);
    }
  }

  async function fetchStatus() {
    try {
      const res = await fetch("/api/hub/uec/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const url1 = "/api/hub/uec/notices?limit=all&unreadOnly=" + String(unreadOnly);
      const url2 = "/api/hub/uec/schedule?limit=20";
      const url3 = "/api/hub/uec/timetable";

      const [noticesRes, scheduleRes, timetableRes] = await Promise.all([
        fetch(url1),
        fetch(url2),
        fetch(url3),
      ]);

      const noticesData = await noticesRes.json();
      const scheduleData = await scheduleRes.json();
      const timetableData = await timetableRes.json();

      if (noticesData.success) {
        setNotices(noticesData.notices || []);
      }
      if (scheduleData.success) {
        setSchedule(scheduleData.schedule || []);
      }
      if (timetableData.success) {
        setTimetable(timetableData.timetable || []);
      }
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/hub/uec/logout", { method: "POST" });
      await fetchSessionStatus();
      await fetchStatus();
      setNotices([]);
      setSchedule([]);
      setTimetable([]);
    } catch (err) {
      setError("ログアウトに失敗しました");
      console.error("Failed to logout:", err);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/hub/uec/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        await fetchStatus();
        await fetchData();
      } else {
        setError(data.error || "同期に失敗しました");
      }
    } catch (err) {
      setError("同期に失敗しました");
      console.error("Failed to sync:", err);
    } finally {
      setSyncing(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const dayOrder = ["月", "火", "水", "木", "金", "土", "日"];
  const sortedTimetable = [...timetable].sort((a, b) => {
    const dayIndexA = dayOrder.indexOf(a.day);
    const dayIndexB = dayOrder.indexOf(b.day);
    if (dayIndexA !== dayIndexB) {
      return dayIndexA - dayIndexB;
    }
    return parseInt(a.period) - parseInt(b.period);
  });

  const timetableByDay = sortedTimetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, UecTimetableEntry[]>);

  if (!sessionStatus?.isLoggedIn || !status?.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            UECポータルにログイン
          </CardTitle>
          <CardDescription>
            UECポータルのデータを取得するには、CLIでログインが必要です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
              <h3 className="font-medium text-sm mb-2 text-emerald-800 dark:text-emerald-200">
                データ同期手順
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                <li>ターミナルを開く</li>
                <li>
                  以下のコマンドを実行:
                  <code className="block ml-4 mt-1 p-2 bg-emerald-100 dark:bg-emerald-900 rounded text-xs font-mono">
                    npm run uec:sync
                  </code>
                </li>
                <li>起動したブラウザでUECポータルにログイン（まだログインしていない場合）</li>
                <li>ログイン完了後、データが自動的に取得されます</li>
                <li>このページを再読み込み</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowLoginHelp(!showLoginHelp)}
                variant="outline"
                className="flex-1"
              >
                {showLoginHelp ? "詳細を隠す" : "詳細を表示"}
              </Button>
              <Button
                onClick={fetchSessionStatus}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                状態を更新
              </Button>
            </div>

            {showLoginHelp && (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">データを同期する</h4>
                  <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                    npm run uec:sync
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    ログインとデータ取得を1つのコマンドで実行します
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">ログアウト</h4>
                  <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                    npm run uec:logout
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    セッションとデータを削除します
                  </p>
                </div>
              </div>
            )}

            {!status?.enabled && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  まだUECポータル連携を有効にしていません
                </p>
                <Button
                  onClick={() => router.push("/hub/settings")}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  設定画面で有効にする
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ログイン済み
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {status?.lastSync
              ? "最終同期: " + new Date(status.lastSync).toLocaleString("ja-JP")
              : "まだ同期していません"}
          </p>
          {status && (
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                お知らせ {status.counts.notices}件
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                予定 {status.counts.schedule}件
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                時間割 {status.counts.timetable}件
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className={"h-4 w-4 mr-2 " + (syncing ? "animate-spin" : "")} />
            {syncing ? "同期中..." : "今すぐ同期"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notices">
        <TabsList>
          <TabsTrigger value="notices">
            <Bell className="h-4 w-4 mr-2" />
            お知らせ
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            予定
          </TabsTrigger>
          <TabsTrigger value="timetable">
            <Clock className="h-4 w-4 mr-2" />
            時間割
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>お知らせ</CardTitle>
                <CardDescription>
                  {notices.length}件のお知らせ
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("category")}
                    className={"px-3 py-1 text-xs rounded transition-colors " +
                      (viewMode === "category"
                        ? "bg-emerald-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800")}
                  >
                    カテゴリ別
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={"px-3 py-1 text-xs rounded transition-colors " +
                      (viewMode === "list"
                        ? "bg-emerald-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800")}
                  >
                    一覧
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                    className="rounded"
                  />
                  未読のみ
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : notices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {unreadOnly ? "未読のお知らせはありません" : "お知らせはありません"}
                </p>
              ) : viewMode === "category" ? (
                <div className="space-y-4">
                  {(() => {
                    // カテゴリでグループ化
                    const grouped = notices.reduce((acc, notice) => {
                      // カテゴリから余分な空白を削除
                      const cleanCategory = notice.category?.trim().replace(/\s+/g, " ") || "その他";
                      if (!acc[cleanCategory]) {
                        acc[cleanCategory] = [];
                      }
                      acc[cleanCategory].push(notice);
                      return acc;
                    }, {} as Record<string, UecNotice[]>);

                    // カテゴリ名でソート（日本語辞書順）
                    const sortedCategories = Object.keys(grouped).sort((a, b) =>
                      a.localeCompare(b, "ja-JP")
                    );

                    return sortedCategories.map((category) => {
                      const categoryNotices = grouped[category];
                      const isExpanded = expandedCategories.has("all") || expandedCategories.has(category);
                      const unreadCount = categoryNotices.filter(n => n.unread).length;

                      return (
                        <div key={category} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedCategories);
                              if (newExpanded.has(category)) {
                                newExpanded.delete(category);
                              } else {
                                newExpanded.add(category);
                              }
                              setExpandedCategories(newExpanded);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm">{category}</span>
                              <Badge variant="outline" className="text-xs">
                                {categoryNotices.length}件
                              </Badge>
                              {unreadCount > 0 && (
                                <Badge className="bg-emerald-600 text-xs">
                                  {unreadCount}未読
                                </Badge>
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="p-3 space-y-2 bg-white dark:bg-gray-950">
                              {categoryNotices.map((notice) => {
                                const isNoticeExpanded = expandedNotices.has(notice.id);
                                const hasDetail = notice.detailHtml || notice.detailText;

                                return (
                                  <div
                                    key={notice.id}
                                    className={
                                      "p-3 rounded-lg border " +
                                      (notice.unread
                                        ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800"
                                        : "border-gray-200 dark:border-gray-800")
                                    }
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {notice.unread && (
                                            <Badge className="bg-emerald-600 text-xs">未読</Badge>
                                          )}
                                        </div>
                                        <h3 className="font-medium text-sm">{notice.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                          {notice.date && <span>📅 {formatDate(notice.date)}</span>}
                                          {notice.publisher && <span>👤 {notice.publisher}</span>}
                                        </div>
                                      </div>
                                      {hasDetail && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newExpanded = new Set(expandedNotices);
                                            if (newExpanded.has(notice.id)) {
                                              newExpanded.delete(notice.id);
                                            } else {
                                              newExpanded.add(notice.id);
                                            }
                                            setExpandedNotices(newExpanded);
                                          }}
                                          className="shrink-0"
                                        >
                                          {isNoticeExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                    {isNoticeExpanded && hasDetail && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        {notice.detailHtml ? (
                                          <div
                                            className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: notice.detailHtml }}
                                          />
                                        ) : (
                                          <p className="text-sm whitespace-pre-wrap">{notice.detailText}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.map((notice) => {
                    const isExpanded = expandedNotices.has(notice.id);
                    const hasDetail = notice.detailHtml || notice.detailText;

                    return (
                      <div
                        key={notice.id}
                        className={
                          "p-3 rounded-lg border " +
                          (notice.unread
                            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800"
                            : "border-gray-200 dark:border-gray-800")
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {notice.unread && (
                                <Badge className="bg-emerald-600 text-xs">未読</Badge>
                              )}
                              {notice.category && (
                                <Badge variant="outline" className="text-xs">
                                  {notice.category}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-sm">{notice.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                              {notice.date && <span>📅 {formatDate(notice.date)}</span>}
                              {notice.publisher && <span>👤 {notice.publisher}</span>}
                            </div>
                          </div>
                          {hasDetail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newExpanded = new Set(expandedNotices);
                                if (newExpanded.has(notice.id)) {
                                  newExpanded.delete(notice.id);
                                } else {
                                  newExpanded.add(notice.id);
                                }
                                setExpandedNotices(newExpanded);
                              }}
                              className="shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {isExpanded && hasDetail && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {notice.detailHtml ? (
                              <div
                                className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: notice.detailHtml }}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{notice.detailText}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>今週の予定</CardTitle>
              <CardDescription>今週の予定・イベント</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">予定はありません</p>
              ) : (
                <div className="space-y-3">
                  {schedule.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {entry.dateLabel}（{entry.weekday}）
                        </Badge>
                        {entry.time && (
                          <span className="text-xs text-muted-foreground">🕐 {entry.time}</span>
                        )}
                      </div>
                      <p className="text-sm">{entry.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle>時間割</CardTitle>
              <CardDescription>授業時間割</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : timetable.length === 0 ? (
                <p className="text-sm text-muted-foreground">時間割はありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 dark:border-gray-700 p-2 text-sm bg-gray-100 dark:bg-gray-800">
                          時限
                        </th>
                        {dayOrder.map((day) => (
                          <th
                            key={day}
                            className="border border-gray-300 dark:border-gray-700 p-2 text-sm bg-gray-100 dark:bg-gray-800"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                        <tr key={period}>
                          <td className="border border-gray-300 dark:border-gray-700 p-2 text-sm font-medium bg-gray-50 dark:bg-gray-900">
                            {period}限
                          </td>
                          {dayOrder.map((day) => {
                            const entry = timetableByDay[day]?.find(
                              (e) => parseInt(e.period) === period
                            );
                            return (
                              <td
                                key={day}
                                className="border border-gray-300 dark:border-gray-700 p-2 text-sm"
                              >
                                {entry ? (
                                  <div className="space-y-1">
                                    <p className="font-medium">{entry.title}</p>
                                    {entry.courseCode && (
                                      <p className="text-xs text-muted-foreground">
                                        [{entry.courseCode}]
                                      </p>
                                    )}
                                    {entry.room && (
                                      <p className="text-xs text-muted-foreground">📍 {entry.room}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
