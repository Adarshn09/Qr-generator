import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, QrCode, Users, Calendar } from "lucide-react";

export default function AnalyticsDashboard() {
  // Mock analytics data - replace with actual data from API
  const stats = [
    {
      title: "Total QR Codes",
      value: "24",
      change: "+3 this week",
      trend: "up",
      icon: QrCode
    },
    {
      title: "Total Scans",
      value: "1,429",
      change: "+12% from last month",
      trend: "up", 
      icon: Eye
    },
    {
      title: "This Month",
      value: "342",
      change: "+8% from last month",
      trend: "up",
      icon: Calendar
    },
    {
      title: "Unique Users",
      value: "89",
      change: "+5% from last month",
      trend: "up",
      icon: Users
    }
  ];

  const recentScans = [
    {
      qrCode: "Company Website",
      scans: 23,
      location: "United States",
      device: "Mobile",
      time: "2 hours ago"
    },
    {
      qrCode: "Contact Card", 
      scans: 8,
      location: "Canada",
      device: "Desktop",
      time: "4 hours ago"
    },
    {
      qrCode: "WiFi Access",
      scans: 15,
      location: "United Kingdom", 
      device: "Mobile",
      time: "6 hours ago"
    }
  ];

  const topPerformers = [
    { name: "Company Website", scans: 247, percentage: 45 },
    { name: "Contact Card", scans: 189, percentage: 34 },
    { name: "WiFi Access", scans: 156, percentage: 28 },
    { name: "Social Media", scans: 98, percentage: 18 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track performance and insights for your QR codes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performing QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Performing QR Codes
            </CardTitle>
            <CardDescription>Most scanned QR codes this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">{item.scans}</p>
                    <p className="text-xs text-muted-foreground">scans</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scan Activity</CardTitle>
            <CardDescription>Latest QR code scans and interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{scan.qrCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {scan.location} • {scan.device}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{scan.scans} scans</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{scan.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Trends</CardTitle>
          <CardDescription>QR code scan activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chart visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
