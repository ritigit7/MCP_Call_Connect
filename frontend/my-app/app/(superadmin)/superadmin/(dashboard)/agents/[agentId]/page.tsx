"use client"

import * as React from "react"
import {
  ArrowUp,
  BadgeCheck,
  Eye,
  FileText,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Power,
  Star,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { Progress } from "@/components/ui/progress"

const AgentProfilePage = ({ params }: { params: { agentId: string } }) => {
  // Mock data - replace with actual data fetching
  const agent = {
    name: "Sarah Smith",
    email: "sarah.smith@company.com",
    role: "Senior Support Agent",
    avatar: "https://i.pravatar.cc/150?u=sarahsmith",
    status: "Online",
    memberSince: "Jan 2023",
  }

  const stats = [
    { title: "Total Calls", value: "52", change: "+5", icon: <Phone className="h-5 w-5 text-muted-foreground" /> },
    { title: "Completed Calls", value: "48", change: "+4", icon: <BadgeCheck className="h-5 w-5 text-muted-foreground" /> },
    { title: "Avg Score", value: "9.2", change: "+0.3", icon: <Star className="h-5 w-5 text-muted-foreground" /> },
    { title: "FCR Rate", value: "92%", change: "+2%", icon: <TrendingUp className="h-5 w-5 text-muted-foreground" /> },
  ]

  const performanceData = [
    { name: "Jan 1", score: 8.5 },
    { name: "Jan 5", score: 8.8 },
    { name: "Jan 10", score: 8.7 },
    { name: "Jan 15", score: 9.1 },
    { name: "Jan 20", score: 9.3 },
    { name: "Jan 25", score: 9.2 },
    { name: "Jan 30", score: 9.5 },
  ]

  const recentCalls = [
    { date: "Jan 15", customer: "John Doe", duration: "5m 32s", score: 9.5 },
    { date: "Jan 14", customer: "Jane S.", duration: "4m 18s", score: 9.0 },
    { date: "Jan 14", customer: "Mike W.", duration: "6m 45s", score: 8.8 },
    { date: "Jan 13", customer: "Lisa K.", duration: "7m 12s", score: 9.2 },
    { date: "Jan 12", customer: "David B.", duration: "3m 55s", score: 8.5 },
  ]

  const skills = [
    { name: "Communication", score: 9.5, value: 95 },
    { name: "Professionalism", score: 9.3, value: 93 },
    { name: "Empathy", score: 9.0, value: 90 },
    { name: "Problem Solving", score: 8.9, value: 89 },
    { name: "Product Knowledge", score: 8.7, value: 87 },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 bg-muted/40">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/superadmin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/superadmin/agents">Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agent.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.email}</p>
            <p className="text-muted-foreground">{agent.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={agent.status === "Online" ? "default" : "outline"} className="bg-green-500 text-white">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                {agent.status}
              </Badge>
              <p className="text-sm text-muted-foreground">Member since: {agent.memberSince}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
            <Button variant="outline" size="sm"><KeyRound className="h-4 w-4 mr-2" /> Reset Password</Button>
            <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-2" /> Email</Button>
            <Button variant="destructive" size="sm"><Power className="h-4 w-4 mr-2" /> Deactivate</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center text-green-600">
                <ArrowUp className="h-3 w-3 mr-1" /> {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeDasharray="92, 100" strokeLinecap="round" transform="rotate(-90 18 18)" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">9.2<span className="text-lg text-muted-foreground">/10</span></span>
                <span className="text-sm text-muted-foreground">Overall</span>
              </div>
            </div>
            <p className="text-sm font-medium text-green-600">Top 5% of all agents</p>
            <div className="w-full space-y-3 pt-4">
              <h3 className="font-semibold">Skill Breakdown:</h3>
              {skills.map(skill => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{skill.name}</span>
                    <span className="font-semibold">{skill.score}/10</span>
                  </div>
                  <Progress value={skill.value} className="h-2 [&>div]:bg-blue-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5" /> Score Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[8, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))"
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BadgeCheck className="mr-2 h-5 w-5" /> Strengths (15)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Excellent communication skills</li>
              <li>High empathy and patient tone</li>
              <li>Quick to resolve complex issues</li>
              <li>Maintains a professional demeanor</li>
              <li>Demonstrates active listening</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="p-0 h-auto">Show all →</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-amber-600"><AlertTriangle className="mr-2 h-5 w-5" /> Areas for Improvement (3)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Response time could be improved on initial contact</li>
              <li>Occasional gaps in new product feature knowledge</li>
              <li>Could provide more detailed documentation in tickets</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="p-0 h-auto">View details →</Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Phone className="mr-2 h-5 w-5" /> Recent Calls (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCalls.map((call, index) => (
                <TableRow key={index}>
                  <TableCell>{call.date}</TableCell>
                  <TableCell>{call.customer}</TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell><Badge variant="outline">{call.score}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="p-0 h-auto">View All Calls →</Button>
        </CardFooter>
      </Card>

    </div>
  )
}

export default AgentProfilePage