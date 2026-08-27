import React, { useState } from 'react';
import { ChevronRight, Download, Send, Star, Trash2, ArrowRight, Bell, X, Eye, EyeOff, Mail, Search } from 'lucide-react';
import { AnimatedBadge } from '../components/motion/animated-badge';
import { Button } from '../components/motion/button/base';
import { MagneticButton } from '../components/motion/button/magnetic';
import { MetallicButton } from '../components/motion/button/metallic';
import { StatefulButton } from '../components/motion/button/stateful';
import { Switch } from '../components/motion/switch';
import { Input } from '../components/motion/input';
import { Checkbox } from '../components/motion/checkbox';
import { NumberTicker } from '../components/motion/number-ticker';
import { RangeSlider } from '../components/motion/range-slider';
import { Tooltip } from '../components/motion/tooltip';
import { Magnetic } from '../components/motion/magnetic';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/motion/select';
import { WheelPicker } from '../components/motion/wheel-picker';
import { ExpandableButton, ExpandableChip } from '../components/motion/expandable-control';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/motion/tabs';

const Section = ({ title, children }) => (
  <div className="flex flex-col gap-2 w-full">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
    {children}
  </div>
);

export default function Showcase() {
  const [switchState, setSwitchState] = useState(false);
  const [sliderValue, setSliderValue] = useState([50]);
  
  // Stateful Button states
  const [okState, setOkState] = useState("idle");
  const [errState, setErrState] = useState("idle");
  
  const runButtonState = (target) => {
    const setter = target === "ok" ? setOkState : setErrState;
    setter("loading");
    setTimeout(() => {
      setter(target === "ok" ? "success" : "error");
      setTimeout(() => setter("idle"), 1800);
    }, 1400);
  };

  // Input Preview states
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("hunter2");
  const [query, setQuery] = useState("Ada");
  const [showPass, setShowPass] = useState(false);
  const emailError = email.length > 0 && !email.includes("@") ? "Enter a valid email address." : undefined;

  // Checkbox Preview states
  const [terms, setTerms] = useState(true);
  const [updates, setUpdates] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 sm:p-16">
      <div className="max-w-4xl mx-auto space-y-16">
        <header>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">Basics & Inputs</h1>
          <p className="text-muted-foreground">Essential interactive components and motion fundamentals.</p>
        </header>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Buttons & Actions</h2>
          
          <div className="space-y-12">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-primary">Standard Buttons</h3>
              <p className="text-sm text-muted-foreground mb-6">Interactive buttons with multiple variants, sizes, and ripple effects.</p>
              <div className="flex flex-col items-start gap-6 border border-border/40 p-6 rounded-2xl bg-muted/10">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="md">
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="secondary" size="md">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="md">Outline</Button>
                  <Button variant="ghost" size="md">Ghost</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="secondary" size="icon" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="md" ripple>Ripple</Button>
                  <Button variant="outline" size="md" ripple>Tap me</Button>
                  <MagneticButton>Magnetic</MagneticButton>
                  <MetallicButton>Metallic</MetallicButton>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-primary">Stateful Buttons</h3>
              <p className="text-sm text-muted-foreground mb-6">Buttons that handle loading, success, and error states internally with smooth micro-animations.</p>
              <div className="flex flex-wrap items-center gap-6 border border-border/40 p-6 rounded-2xl bg-muted/10">
                <StatefulButton
                  state={okState}
                  variant="primary"
                  size="md"
                  onClick={() => runButtonState("ok")}
                  loadingText="Saving"
                  successText="Saved"
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  Save changes
                </StatefulButton>
                <StatefulButton
                  state={errState}
                  variant="secondary"
                  size="md"
                  onClick={() => runButtonState("err")}
                  loadingText="Submitting"
                  errorText="Failed"
                >
                  Submit
                </StatefulButton>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Badges & Tickers</h2>
          <AnimatedBadgePreview />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Custom Utilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-primary">The Ultimate Box Shadow</h3>
              <p className="text-sm text-muted-foreground mb-6">A deeply carved, heavily layered inset/outset shadow perfect for skeuomorphic elements. Mapped to <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">shadow-ultimate</code>.</p>
              
              <div className="h-48 w-full rounded-4xl-background shadow-ultimate flex flex-col items-center justify-center border border-border/40 gap-3">
                <span className="font-bold text-muted-foreground tracking-widest uppercase text-xl">Deep Inset</span>
                <span className="text-xs text-muted-foreground/70 font-medium tracking-wider">shadow-ultimate</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Expandable Controls</h2>
          <div className="flex flex-col items-start gap-6 border border-border/40 p-6 rounded-2xl bg-muted/10">
            <div className="flex items-center gap-4">
              <ExpandableButton
                icon={<Bell className="size-4" />}
                label="Notifications"
              />
              <ExpandableChip
                label="React"
                actionIcon={<X className="size-3.5" />}
                actionLabel="Remove React"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Tabs Navigation</h2>
          <div className="flex w-full max-w-2xl flex-col gap-10 border border-border/40 p-8 rounded-2xl bg-muted/10">
            <Section title="Pill Variant">
              <Tabs defaultValue="overview" variant="pill">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="overview" className="text-sm text-muted-foreground">High-level summary.</TabsContent>
                  <TabsContent value="activity" className="text-sm text-muted-foreground">Recent events.</TabsContent>
                  <TabsContent value="settings" className="text-sm text-muted-foreground">Preferences.</TabsContent>
                </div>
              </Tabs>
            </Section>
            
            <Section title="Segment Variant">
              <Tabs defaultValue="day" variant="segment">
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </Section>
            
            <Section title="Underline Variant">
              <Tabs defaultValue="all" variant="underline">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </Section>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Forms & Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <Section title="Rich Inputs">
                <div className="flex w-full max-w-xs flex-col gap-5">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target?.value ?? e)}
                    error={emailError}
                    maxLength={255}
                    sanitize="email"
                  />
                  <Input
                    label="Password"
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target?.value ?? e)}
                    maxLength={128}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                        className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <Input
                    label="Search"
                    leftIcon={<Search className="w-4 h-4" />}
                    value={query}
                    onChange={(e) => setQuery(e.target?.value ?? e)}
                    success={query.length > 1}
                  />
                </div>
              </Section>

              <Section title="Checkboxes & Toggles">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={switchState} onCheckedChange={setSwitchState} />
                    <span className="text-sm font-medium">Toggle Switch ({switchState ? 'On' : 'Off'})</span>
                  </div>
                  <Checkbox
                    checked={terms}
                    onCheckedChange={setTerms}
                    label="Accept terms and conditions"
                  />
                  <Checkbox
                    checked={updates}
                    onCheckedChange={setUpdates}
                    label="Email me product updates"
                  />
                  <Checkbox checked indeterminate onCheckedChange={() => {}} label="Select all (partial)" />
                  <Checkbox checked disabled onCheckedChange={() => {}} label="Disabled" />
                </div>
              </Section>

              <div>
                <label className="text-sm font-medium mb-3 block text-muted-foreground">Range Slider</label>
                <RangeSliderPreview />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Animated Select</label>
                <Select defaultValue="option-2">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option-1">Design System</SelectItem>
                    <SelectItem value="option-2">Motion UI</SelectItem>
                    <SelectItem value="option-3">Interaction Patterns</SelectItem>
                    <SelectItem value="option-4">Accessibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">iOS Wheel Picker</label>
                <div className="border border-border rounded-xl bg-background overflow-hidden p-2">
                  <WheelPicker 
                    options={['Apple', 'Banana', 'Cherry', 'Durian', 'Elderberry', 'Fig', 'Grape']} 
                    defaultValue="Cherry"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-2">Tooltips & Overlays</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip content="This is a useful tooltip message!" side="top">
              <span className="cursor-help underline decoration-dashed decoration-primary-500">Hover over me</span>
            </Tooltip>
          </div>
        </section>
      </div>
    </div>
  );
}

const STATES = [
  { status: "loading", label: "Syncing" },
  { status: "success", label: "Synced" },
  { status: "warning", label: "Review" },
  { status: "danger", label: "Failed" },
];

function AnimatedBadgePreview() {
  const [active, setActive] = React.useState(0);
  const state = STATES[active];

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % STATES.length);
    }, 1600);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex h-16 items-center justify-center">
        <AnimatedBadge status={state.status} size="md" aria-live="polite">
          {state.label}
        </AnimatedBadge>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <AnimatedBadge status="neutral" size="sm">Queued</AnimatedBadge>
        <AnimatedBadge status="info" size="sm">Live</AnimatedBadge>
        <AnimatedBadge status="loading" size="sm">Indexing</AnimatedBadge>
        <AnimatedBadge status="success" size="sm">Verified</AnimatedBadge>
        <AnimatedBadge status="warning" size="sm">Pending</AnimatedBadge>
        <AnimatedBadge status="danger" size="sm">Blocked</AnimatedBadge>
        <div className="bg-muted p-2 rounded-lg border border-border text-xl font-bold ml-4">
          <NumberTicker value={24562} />
        </div>
      </div>
    </div>
  );
}

function RangeSliderPreview() {
  const [value, setValue] = React.useState(40);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Drag the handle</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <RangeSlider value={value} onValueChange={setValue} step={5} max={100} aria-label="Value" />
    </div>
  );
}
