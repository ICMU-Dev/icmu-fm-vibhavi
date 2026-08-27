import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/motion/popover';
import { Tooltip } from '../components/motion/tooltip';
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut } from '../components/motion/context-menu';
import { Drawer } from '../components/motion/drawer';
import { Button } from '../components/motion/button/base';
import { MorphPopover, MorphPopoverTrigger, MorphPopoverContent } from '../components/motion/popover-morph';
import { ExpandableTabs } from '../components/motion/expandable-tabs';
import { FeedbackWidget } from '../components/motion/feedback-widget';
import { ActionSwap } from '../components/motion/action-swap';
import { ActionSwapCascadeButton } from '../components/motion/action-swap-cascade';
import { NotificationStack } from '../components/motion/notification-stack';
import { Home, Bell, Settings, User, Check, Copy, Download, Eye, Pencil, Trash2, BadgeCheck, Brush, CalendarClock, ChartSpline, ChevronRight, ClipboardCheck, CloudUpload, FileText, Gauge, GitBranch, Images, Inbox, Megaphone, MessageCircle, PackageOpen, RefreshCw, Rocket, Siren, SwatchBook, UploadCloud, Users, Webhook, Workflow } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SPRING_SWAP } from '@/lib/ease';

export default function ShowcaseOverlays() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contextMessage, setContextMessage] = useState(null);
  const [offline, setOffline] = useState(false);
  const reduce = useReducedMotion() ?? false;
  
  const [notifications, setNotifications] = useState([
    { id: "1", title: "New Message", description: "You have a new message from Jane.", trailing: "1m ago" },
    { id: "2", title: "Update Available", description: "System update v2.0 is ready.", trailing: "10m ago" },
  ]);

  const tabs = [
    { id: "home", title: "Home", icon: <Home className="w-4 h-4" /> },
    { id: "alerts", title: "Alerts", icon: <Bell className="w-4 h-4" /> },
    { id: "settings", title: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "profile", title: "Profile", icon: <User className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-16">
      <header>
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Overlays & Context</h1>
        <p className="text-muted-foreground">Popovers, Context Menus, Drawers, and Interactive widgets.</p>
      </header>
      
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Popovers & Tooltips</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Popover>
            <PopoverTrigger><Button>Standard Popover</Button></PopoverTrigger>
            <PopoverContent>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-lg text-primary">Popover Title</h3>
                <p className="text-sm text-foreground">This is a floating popover layer.</p>
              </div>
            </PopoverContent>
          </Popover>

          <MorphPopover>
            <MorphPopoverTrigger><Button variant="secondary">Morphing Popover</Button></MorphPopoverTrigger>
            <MorphPopoverContent className="p-6 space-y-3 min-w-50">
              <h3 className="font-bold">Morphed Content</h3>
              <p className="text-sm text-muted-foreground">This popover animates outward seamlessly from its trigger button.</p>
            </MorphPopoverContent>
          </MorphPopover>

          <Tooltip content="Helper Tooltip Message" side="top">
            <span className="cursor-help inline-flex items-center justify-center h-10 px-4 rounded-full border border-border bg-card text-foreground">
              Hover Me
            </span>
          </Tooltip>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Drawers & Menus</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} side="bottom">
            <div className="p-8 h-64 mx-auto w-full max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">Bottom Drawer</h2>
              <p className="text-muted-foreground">This drawer slides up from the bottom of the screen.</p>
            </div>
          </Drawer>
          
          <div className="flex min-h-90 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 p-8">
            <ContextMenu>
              <ContextMenuTrigger>
                <button
                  type="button"
                  className="group flex flex-col items-center outline-none"
                >
                  <div className="relative h-24 w-32 transition-transform duration-150 group-active:scale-[0.98] group-focus-visible:rounded-2xl group-focus-visible:ring-2 group-focus-visible:ring-foreground/20 group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background">
                    <div className="absolute left-1 top-1 h-7 w-14 rounded-t-[10px] bg-[#d4a84f] dark:bg-[#a77d2f]" />
                    <div className="absolute inset-x-0 bottom-0 top-5 rounded-[14px] bg-[#e7bb61] shadow-[0_14px_24px_-16px_rgba(90,58,8,0.75)] dark:bg-[#bd8d36]" />
                    <div className="absolute inset-x-0 bottom-0 top-9 rounded-[14px] bg-[#efc86f] dark:bg-[#cb9a41]" />
                    <div className="absolute inset-x-5 bottom-4 h-px bg-black/10 dark:bg-white/10" />
                  </div>

                  <span className="mt-4 text-sm font-medium text-foreground">
                    Right click on me
                  </span>

                  <div className="mt-1 h-4">
                    <AnimatePresence mode="wait" initial={false}>
                      {contextMessage ? (
                        <motion.span
                          key={contextMessage}
                          initial={
                            reduce
                              ? { opacity: 0 }
                              : { opacity: 0, y: 3, filter: "blur(2px)" }
                          }
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={
                            reduce
                              ? { opacity: 0 }
                              : { opacity: 0, y: -2, filter: "blur(2px)" }
                          }
                          transition={reduce ? { duration: 0.1 } : SPRING_SWAP}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground"
                        >
                          <Check aria-hidden="true" className="h-3 w-3 text-success" />
                          {contextMessage}
                        </motion.span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          or long-press · Shift + F10
                        </span>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </ContextMenuTrigger>

              <ContextMenuContent ariaLabel="Folder actions" className="w-60">
                <ContextMenuLabel>Project files</ContextMenuLabel>
                <ContextMenuItem
                  textValue="Open"
                  onSelect={() => setContextMessage("Folder opened")}
                >
                  <Eye aria-hidden="true" className="h-4 w-4" />
                  Open
                  <ContextMenuShortcut>↵</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                  textValue="Rename"
                  onSelect={() => setContextMessage("Ready to rename")}
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                  Rename
                  <ContextMenuShortcut>R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                  textValue="Duplicate"
                  onSelect={() => setContextMessage("Folder duplicated")}
                >
                  <Copy aria-hidden="true" className="h-4 w-4" />
                  Duplicate
                  <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                  textValue="Download"
                  onSelect={() => setContextMessage("Download started")}
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuCheckboxItem
                  textValue="Keep offline"
                  checked={offline}
                  closeOnSelect={false}
                  onCheckedChange={(checked) => {
                    setOffline(checked);
                    setContextMessage(checked ? "Available offline" : "Online only");
                  }}
                >
                  Keep offline
                </ContextMenuCheckboxItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  tone="destructive"
                  textValue="Move to trash"
                  onSelect={() => setContextMessage("Moved to trash")}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Move to trash
                  <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Interactive Widgets</h2>
        
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Action Swaps</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <ActionSwap items={[{ id: 'off', label: 'Subscribe' }, { id: 'on', label: 'Subscribed!' }]} />
              <ActionSwapCascadeButton items={[{ id: 'off', label: 'Copy to clipboard' }, { id: 'on', label: 'Copied!' }]} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expandable Tabs</h3>
            <ExpandableTabsPreview />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Floating Feedback</h3>
            <div className="h-24 w-full relative border border-border rounded-xl bg-card">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <FeedbackWidget onSubmit={(data) => console.log('Feedback:', data)} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notification Stack</h3>
            <div className="h-96 w-full flex items-center justify-center relative border border-border rounded-xl bg-card overflow-hidden p-6">
              <NotificationStack 
                items={notifications} 
                onRemove={(id) => setNotifications(n => n.filter(x => x.id !== id))} 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ icon: Icon, label }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function Menu({ rows }) {
  return (
    <div className="flex w-68.5 flex-col gap-0.5">
      {rows.map((r) => (
        <Row key={r.label} icon={r.icon} label={r.label} />
      ))}
    </div>
  );
}

export function ExpandableTabsPreview() {
  return (
    <div className="flex min-h-88 w-full items-end justify-center border border-border/40 p-6 rounded-2xl bg-muted/10 h-96 pb-12">
      <ExpandableTabs
        items={[
          {
            id: "launch",
            label: "Launch",
            icon: <Rocket className="h-4 w-4" />,
            content: (
              <Menu
                rows={[
                  { icon: FileText, label: "Release Brief" },
                  { icon: ClipboardCheck, label: "Launch Checklist" },
                  { icon: Megaphone, label: "Campaign Notes" },
                  { icon: CalendarClock, label: "Rollout Calendar" },
                  { icon: CloudUpload, label: "Ship Build" },
                ]}
              />
            ),
          },
          {
            id: "inbox",
            label: "Inbox",
            icon: <Inbox className="h-4 w-4" />,
            content: (
              <Menu
                rows={[
                  { icon: MessageCircle, label: "Client Feedback" },
                  { icon: Users, label: "Team Requests" },
                  { icon: BadgeCheck, label: "Approval Notes" },
                ]}
              />
            ),
          },
          {
            id: "flows",
            label: "Flows",
            icon: <Workflow className="h-4 w-4" />,
            content: (
              <Menu
                rows={[
                  { icon: GitBranch, label: "Trigger Map" },
                  { icon: Webhook, label: "Webhook Runs" },
                  { icon: RefreshCw, label: "Retry Queue" },
                ]}
              />
            ),
          },
          {
            id: "assets",
            label: "Assets",
            icon: <PackageOpen className="h-4 w-4" />,
            content: (
              <Menu
                rows={[
                  { icon: SwatchBook, label: "Brand Kit" },
                  { icon: Images, label: "Mockup Library" },
                  { icon: Brush, label: "Design Tokens" },
                  { icon: UploadCloud, label: "Export Queue" },
                ]}
              />
            ),
          },
          {
            id: "status",
            label: "Status",
            icon: <ChartSpline className="h-4 w-4" />,
            content: (
              <Menu
                rows={[
                  { icon: Gauge, label: "Activation" },
                  { icon: ChartSpline, label: "Conversion" },
                  { icon: Siren, label: "Incidents" },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
