import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Eye, Download, Trash2, QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QrManagement() {
  // Mock data - replace with actual data from API
  const qrCodes = [
    {
      id: "1",
      title: "Company Website",
      type: "URL",
      data: "https://company.com",
      scans: 247,
      created: "2 days ago",
      status: "active"
    },
    {
      id: "2", 
      title: "Contact Card",
      type: "vCard",
      data: "John Doe",
      scans: 89,
      created: "1 week ago",
      status: "active"
    },
    {
      id: "3",
      title: "WiFi Access",
      type: "WiFi",
      data: "Office Network",
      scans: 156,
      created: "2 weeks ago", 
      status: "paused"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage QR Codes</h1>
          <p className="text-muted-foreground">View and manage all your generated QR codes</p>
        </div>
        <Button data-testid="button-new-qr">
          <QrCode className="w-4 h-4 mr-2" />
          New QR Code
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search QR codes..."
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" data-testid="button-filter">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your QR Codes</CardTitle>
          <CardDescription>
            {qrCodes.length} QR codes total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrCodes.map((qr) => (
                <TableRow key={qr.id} data-testid={`row-qr-${qr.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{qr.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {qr.data}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{qr.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{qr.scans}</TableCell>
                  <TableCell className="text-muted-foreground">{qr.created}</TableCell>
                  <TableCell>
                    <Badge variant={qr.status === "active" ? "default" : "secondary"}>
                      {qr.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-actions-${qr.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
