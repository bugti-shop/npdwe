import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sparkles, Star, Zap, Shield, Palette, Bell, Map, Search, FolderOpen, ListTodo, StickyNote, Settings, Moon, FileText, Calendar, User, BarChart3, Plus, Columns3, Lock, Database, FileCode, FileEdit, Type, Bold, Image, Table, Mic } from 'lucide-react';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import { useTranslation } from 'react-i18next';
import { FeatureTour, TourStep } from './FeatureTour';

// Tour step images
import imgStickyNotes from '@/assets/feature-sticky-notes.png';
import imgEditor from '@/assets/feature-editor.png';
import imgCodeEditor from '@/assets/feature-code-editor.png';
import imgFontStyling from '@/assets/feature-font-styling.png';
import imgMedia from '@/assets/feature-media.png';
import imgTables from '@/assets/feature-tables.png';
import imgHome from '@/assets/feature-home.png';
import imgTaskList from '@/assets/feature-task-list-new.png';
import imgFolders from '@/assets/feature-folders.png';
import imgNotesTypes from '@/assets/feature-notes-types.png';
import imgVoice from '@/assets/showcase-voice.png';
import imgOptions from '@/assets/feature-options.png';

// ─── Changelog: update this array with each release ───
export const APP_VERSION = '2.5.0';

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: { icon: React.ReactNode; title: string; description: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: 'February 2025',
    highlights: [
      { icon: <Star className="h-4 w-4 text-warning" />, title: 'Free Google Sign-in & Sync', description: 'Google account sync is now completely free for all users.' },
      { icon: <Shield className="h-4 w-4 text-success" />, title: 'Cross-Device Subscription', description: 'Your Pro subscription now follows your Google account across devices.' },
      { icon: <Bell className="h-4 w-4 text-info" />, title: 'In-App Review Prompt', description: 'Rate the app directly without leaving — appears after 10 completed tasks.' },
      { icon: <Zap className="h-4 w-4 text-streak" />, title: 'Account Management', description: 'New account deletion option in Settings for full data control.' },
      { icon: <Palette className="h-4 w-4 text-accent-purple" />, title: 'Performance Improvements', description: 'Faster load times and smoother animations throughout the app.' },
    ],
  },
];

// ─── Comprehensive Full-App Tour Steps ───
const tourSteps: TourStep[] = [
  // === WELCOME ===
  {
    target: 'center',
    placement: 'center',
    title: '🎉 Welcome to the Npd Tour!',
    description: "Let's walk through every major feature of your app. You can skip anytime by tapping outside.",
    image: imgHome,
    navigateTo: '/',
  },

  // === EARLY: CREATE NOTE & FOLDER ===
  {
    target: '[data-tour="new-note-button"]',
    placement: 'top',
    title: 'Create Your First Note',
    icon: <StickyNote className="h-5 w-5 text-amber-500" />,
    description: 'Tap here to create a new note! Choose from Sticky Notes, Lined Notes, Regular Notes, Code Editor, and LinkedIn Formatter.',
    navigateTo: '/',
  },
  {
    target: '[data-tour="folders-section"]',
    placement: 'bottom',
    title: 'Organize with Folders',
    icon: <FolderOpen className="h-5 w-5 text-amber-500" />,
    description: 'Create folders to organize your notes. Tap the ⋮ menu to add, rename, or reorder folders. Drag notes between them.',
    navigateTo: '/',
  },

  // === EARLY: SWITCH TO TODO & CREATE TASKS ===
  {
    target: '[data-tour="switch-to-todo"]',
    placement: 'bottom',
    title: 'Switch to Tasks',
    icon: <ListTodo className="h-5 w-5 text-primary" />,
    description: 'Tap here to jump to your To-Do dashboard where you can manage tasks, folders, and sections.',
    navigateTo: '/',
  },
  {
    target: '[data-tour="todo-add-task"]',
    placement: 'top',
    title: 'Create Your First Task',
    icon: <Plus className="h-5 w-5 text-primary" />,
    description: 'Tap to add a new task! Set due dates, priorities, reminders, subtasks, and assign to folders or sections.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="todo-folders-section"]',
    placement: 'bottom',
    title: 'Task Folders',
    icon: <FolderOpen className="h-5 w-5 text-amber-500" />,
    description: 'Create project folders to organize your tasks. Keep work, personal, and other projects separate.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="task-section"]',
    placement: 'bottom',
    title: 'Task Sections',
    icon: <ListTodo className="h-5 w-5 text-info" />,
    description: 'Group tasks into sections within a folder. Collapse, reorder, rename, and color-code sections.',
    navigateTo: '/todo/today',
  },

  // === BACK TO NOTES DETAILS ===
  {
    target: '[data-tour="switch-to-notes"]',
    placement: 'bottom',
    title: 'Switch to Notes',
    icon: <FileText className="h-5 w-5 text-primary" />,
    description: 'Jump back to your Notes dashboard anytime with this button.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="search-bar"]',
    placement: 'bottom',
    title: 'Search Your Notes',
    icon: <Search className="h-5 w-5 text-primary" />,
    description: 'Quickly find any note with instant search. Toggle between Quick search (titles) and Deep search (full content).',
    navigateTo: '/',
  },
  {
    target: '[data-tour="dark-mode-toggle"]',
    placement: 'bottom',
    title: 'Dark Mode',
    icon: <Moon className="h-5 w-5 text-primary" />,
    description: 'Switch between light and dark themes to match your preference. Multiple theme options available in Settings.',
    navigateTo: '/',
  },

  // === NOTE TYPES ===

  // === TODO DETAILS ===
  {
    target: '[data-tour="todo-search-bar"]',
    placement: 'bottom',
    title: 'Search Tasks',
    icon: <Search className="h-5 w-5 text-primary" />,
    description: 'Search through all your tasks instantly. Find tasks by name, tags, or content.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="todo-options-menu"]',
    placement: 'bottom',
    title: 'View Modes & Options',
    icon: <Columns3 className="h-5 w-5 text-primary" />,
    description: 'Access Smart Lists, Sort, Filter, Kanban board, Timeline, Priority view, and more.',
    navigateTo: '/todo/today',
  },

  // === TODO BOTTOM NAV ===
  {
    target: '[data-tour="todo-home-link"]',
    placement: 'top',
    title: 'Today View',
    icon: <ListTodo className="h-5 w-5 text-info" />,
    description: 'Your main task hub. Add tasks, create sections, use drag-and-drop to reorder. Swipe to complete or set dates.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="todo-progress-link"]',
    placement: 'top',
    title: 'Progress & Analytics',
    icon: <BarChart3 className="h-5 w-5 text-green-500" />,
    description: 'Track your productivity with visual charts, streaks, completion rates, and weekly insights.',
    navigateTo: '/todo/today',
  },
  {
    target: '[data-tour="todo-calendar-link"]',
    placement: 'top',
    title: 'Task Calendar',
    icon: <Calendar className="h-5 w-5 text-purple-500" />,
    description: 'View tasks on a calendar. Drag tasks to reschedule. See overdue, today, and upcoming tasks at a glance.',
    navigateTo: '/todo/today',
  },

  // === SETTINGS TOUR ===
  {
    target: 'center',
    placement: 'center',
    title: '⚙️ Settings Overview',
    description: "Let's quickly look at the key settings that make Npd yours.",
    image: imgOptions,
    navigateTo: '/settings',
  },
  {
    target: '[data-tour="settings-preferences"]',
    placement: 'bottom',
    title: 'Preferences',
    icon: <Palette className="h-5 w-5 text-purple-500" />,
    description: 'Appearance, language, note type visibility, notes settings, tasks settings, toolbar customization, and navigation layout.',
    navigateTo: '/settings',
  },
  {
    target: '[data-tour="settings-notifications"]',
    placement: 'bottom',
    title: 'Notifications',
    icon: <Bell className="h-5 w-5 text-blue-500" />,
    description: 'Control task reminders, note reminders, daily digest, and overdue alerts. Fine-tune what notifications you receive.',
    navigateTo: '/settings',
  },
  {
    target: '[data-tour="settings-security"]',
    placement: 'bottom',
    title: 'Security',
    icon: <Lock className="h-5 w-5 text-green-500" />,
    description: 'Set up App Lock with biometric or PIN authentication to protect your notes and tasks.',
    navigateTo: '/settings',
  },
  {
    target: '[data-tour="settings-data"]',
    placement: 'bottom',
    title: 'Data Management',
    icon: <Database className="h-5 w-5 text-orange-500" />,
    description: 'Backup, restore, download, or delete your data. Keep your information safe with regular backups.',
    navigateTo: '/settings',
  },

  // === FINISH ===
  {
    target: 'center',
    placement: 'center',
    title: '🚀 You\'re All Set!',
    description: 'You now know every corner of Npd! Explore, create, and stay productive. You can replay this tour from Settings anytime.',
    image: imgFolders,
    navigateTo: '/',
  },
];

const LAST_SEEN_VERSION_KEY = 'npd_last_seen_version';

export const WhatsNewSheet = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [unseenEntries, setUnseenEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const check = async () => {
      const lastSeen = await getSetting<string>(LAST_SEEN_VERSION_KEY, '0.0.0');
      if (lastSeen !== APP_VERSION) {
        const unseen = changelog.filter(e => e.version > lastSeen);
        if (unseen.length > 0) {
          setUnseenEntries(unseen);
          setOpen(true);
        }
      }
    };
    const timer = setTimeout(check, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for replay event from Settings
  useEffect(() => {
    const handleReplay = () => {
      setTimeout(() => setShowTour(true), 500);
    };
    window.addEventListener('replayFeatureTour', handleReplay);
    return () => window.removeEventListener('replayFeatureTour', handleReplay);
  }, []);

  // Listen for "show What's New" event from Settings
  useEffect(() => {
    const handleShow = () => {
      setUnseenEntries(changelog);
      setOpen(true);
    };
    window.addEventListener('showWhatsNew', handleShow);
    return () => window.removeEventListener('showWhatsNew', handleShow);
  }, []);

  const handleClose = async () => {
    await setSetting(LAST_SEEN_VERSION_KEY, APP_VERSION);
    setOpen(false);
  };

  const handleStartTour = async () => {
    await setSetting(LAST_SEEN_VERSION_KEY, APP_VERSION);
    setOpen(false);
    setTimeout(() => setShowTour(true), 400);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('whatsNew.title', "What's New")}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-6 pb-4">
              {unseenEntries.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-sm font-bold text-primary">v{entry.version}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <div className="space-y-3">
                    {entry.highlights.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={handleStartTour} className="flex-1 gap-2">
              <Map className="h-4 w-4" />
              {t('whatsNew.takeTour', 'Take a Tour')}
            </Button>
            <Button onClick={handleClose} className="flex-1">
              {t('whatsNew.gotIt', 'Got it!')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {showTour && (
        <FeatureTour
          steps={tourSteps}
          tourId={`full-app-v${APP_VERSION}`}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
};
