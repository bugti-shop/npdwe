import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  getCalendarSyncStatus,
  isCalendarSyncEnabled,
  performFullCalendarSync,
  CalendarSyncStatus,
} from '@/utils/systemCalendarSync';
import { loadTasksFromDB } from '@/utils/taskStorage';
import { getSetting } from '@/utils/settingsStorage';
import { CalendarEvent } from '@/types/note';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const CalendarSyncBadge = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<CalendarSyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStatus = useCallback(async () => {
    const [syncEnabled, syncStatus] = await Promise.all([
      isCalendarSyncEnabled(),
      getCalendarSyncStatus(),
    ]);
    setEnabled(syncEnabled);
    setStatus(syncStatus);
  }, []);

  useEffect(() => {
    loadStatus();
    const handler = () => loadStatus();
    window.addEventListener('calendarSyncStatusUpdated', handler);
    return () => window.removeEventListener('calendarSyncStatusUpdated', handler);
  }, [loadStatus]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const [tasks, events] = await Promise.all([
        loadTasksFromDB(),
        getSetting<CalendarEvent[]>('calendarEvents', []),
      ]);
      const result = await performFullCalendarSync(tasks, events);
      toast.success(
        `Synced: ${result.pushed} pushed, ${result.pulled} pulled`
      );
      await loadStatus();
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!enabled) return null;

  const lastSynced = status?.lastSyncedAt
    ? formatDistanceToNow(new Date(status.lastSyncedAt), { addSuffix: true })
    : null;

  const hasErrors = (status?.errors?.length ?? 0) > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {/* Status dot */}
          <span
            className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
              hasErrors
                ? 'bg-destructive'
                : status?.lastSyncedAt
                  ? 'bg-primary'
                  : 'bg-muted-foreground'
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {t('settings.calendarSync', 'Calendar Sync')}
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
          {lastSynced && (
            <p className="text-xs text-muted-foreground mt-1">
              Last synced {lastSynced}
            </p>
          )}
        </div>

        <div className="p-3 space-y-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{status?.totalSynced ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold text-primary">{status?.pushed ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pushed</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold text-primary">{status?.pulled ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pulled</p>
            </div>
          </div>

          {/* Status message */}
          {hasErrors ? (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{status!.errors[0]}</span>
            </div>
          ) : status?.lastSyncedAt ? (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg p-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>All events are in sync</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span>Not synced yet — tap Sync Now</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
