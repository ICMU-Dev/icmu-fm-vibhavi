import React from 'react';

export default function ShowcaseTypography() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-16">
      <header>
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Typography Guidelines</h1>
        <p className="text-muted-foreground">Fonts, weights, and scale used throughout the application.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Font Families</h2>
        
        <div className="p-8 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-bold">Heading Font (--font-heading)</p>
          <div className="font-heading">
            <div className="text-5xl font-bold mb-2 text-foreground">Montserrat</div>
            <p className="text-lg text-muted-foreground">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
            <p className="text-lg text-muted-foreground">a b c d e f g h i j k l m n o p q r s t u v w x y z</p>
            <p className="text-lg text-muted-foreground">0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( )</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-bold">Body Font (--font-body)</p>
          <div className="font-body">
            <div className="text-5xl font-normal mb-2 text-foreground">Montserrat</div>
            <p className="text-lg text-muted-foreground">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
            <p className="text-lg text-muted-foreground">a b c d e f g h i j k l m n o p q r s t u v w x y z</p>
            <p className="text-lg text-muted-foreground">0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( )</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Type Scale</h2>
        <div className="space-y-8 bg-card border border-border rounded-2xl p-8 shadow-sm">
          <ScaleRow label="5XL" size="text-5xl" value="4.210rem" text="The quick brown fox" />
          <ScaleRow label="4XL" size="text-4xl" value="3.158rem" text="The quick brown fox" />
          <ScaleRow label="3XL" size="text-3xl" value="2.369rem" text="The quick brown fox jumps" />
          <ScaleRow label="2XL" size="text-2xl" value="1.777rem" text="The quick brown fox jumps over" />
          <ScaleRow label="XL" size="text-xl" value="1.333rem" text="The quick brown fox jumps over the lazy dog." />
          <ScaleRow label="Base" size="text-base" value="1rem" text="The quick brown fox jumps over the lazy dog." />
          <ScaleRow label="SM" size="text-sm" value="0.750rem" text="The quick brown fox jumps over the lazy dog." />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Font Weights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-card border border-border text-center">
            <p className="font-normal text-3xl mb-2 text-foreground">Normal (400)</p>
            <p className="text-sm text-muted-foreground">Used for body text and paragraphs.</p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border text-center">
            <p className="font-bold text-3xl mb-2 text-foreground">Bold (700)</p>
            <p className="text-sm text-muted-foreground">Used for headings, buttons, and emphasis.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScaleRow({ label, size, value, text }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 border-b border-border/50 last:border-0 pb-6 last:pb-0">
      <div className="w-32 shrink-0">
        <span className="font-bold text-foreground inline-block w-12">{label}</span>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{value}</span>
      </div>
      <div className={`${size} font-heading font-bold text-foreground truncate`}>
        {text}
      </div>
    </div>
  );
}
