import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { ContainerScroll } from "@/components/landing/ContainerScroll";
import { FeatureSteps } from "@/components/landing/FeatureSteps";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { GridBackground } from "@/components/landing/GridBackground";
import {
  TrendingUp,
  Newspaper,
  Sparkles,
  Shield,
  BarChart3,
  Brain,
  LineChart,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  const steps = [
    {
      number: "1",
      title: "Track Stocks",
      description: "Add stocks to your watchlist and monitor real-time prices from Yahoo Finance",
      icon: <LineChart className="h-10 w-10" />,
    },
    {
      number: "2",
      title: "Aggregate News",
      description: "Pull news from Yahoo Finance, CNBC, and MarketWatch automatically",
      icon: <Newspaper className="h-10 w-10" />,
    },
    {
      number: "3",
      title: "Get AI Insights",
      description: "AI summarizes what matters and explains movements in plain English",
      icon: <Brain className="h-10 w-10" />,
    },
    {
      number: "4",
      title: "Make Decisions",
      description: "Stay informed with clear data and context—no noise, just signal",
      icon: <TrendingUp className="h-10 w-10" />,
    },
  ];

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-Time Stock Data",
      description:
        "Track prices from Yahoo Finance with 52-week ranges, volume, and percentage changes.",
    },
    {
      icon: <Newspaper className="h-6 w-6" />,
      title: "News Aggregation",
      description:
        "Pull headlines from Yahoo Finance, CNBC, and MarketWatch with sentiment analysis.",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Summaries",
      description:
        "Get plain-English explanations of market movements. Ask follow-up questions.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Private & Secure",
      description:
        "Your personal dashboard. No public access. Your data stays yours.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingNav />

      {/* Hero Section */}
      <GridBackground className="min-h-screen">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">
                  AI-Powered Market Intelligence
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
              >
                Understand the Market.
                <br />
                <span className="text-gradient">Don't Chase It.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
              >
                A personal AI-powered dashboard that tracks stocks, summarizes
                news, and highlights what matters—without making predictions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <Button asChild size="lg" className="group gap-2">
                  <a href="/auth">
                    Enter Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#features">Learn More</a>
                </Button>
              </motion.div>
            </div>
          }
        >
          <DashboardPreview />
        </ContainerScroll>
      </GridBackground>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-secondary/30 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Four simple steps to stay informed without the noise
            </p>
          </motion.div>

          <FeatureSteps steps={steps} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Built for learning and long-term thinking, not day trading
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">
              Ready to Think Clearer?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Stop chasing noise. Start understanding signals.
            </p>
            <Button asChild size="lg" className="group gap-2">
              <a href="/auth">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SignalDeck</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SignalDeck. Personal use only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
