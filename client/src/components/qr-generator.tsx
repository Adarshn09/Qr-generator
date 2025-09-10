import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { QrCode, Download, Copy, Palette, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QrCode as QrCodeType } from "@shared/schema";

export default function QrGenerator() {
  const [qrType, setQrType] = useState("url");
  const [qrData, setQrData] = useState("");
  const [generatedQr, setGeneratedQr] = useState<QrCodeType | null>(null);
  
  // Customization options
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [size, setSize] = useState([400]);
  const [logoUrl, setLogoUrl] = useState("");
  const [style, setStyle] = useState("square");
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [margin, setMargin] = useState([2]);
  
  const { toast } = useToast();

  const createQrMutation = useMutation({
    mutationFn: async (data: { type: string; content: string; foregroundColor: string; backgroundColor: string; size: number; logoUrl?: string; style: string; errorCorrection: string; margin: number }) => {
      const res = await apiRequest("POST", "/api/qr-codes", data);
      return await res.json();
    },
    onSuccess: (qrCode: QrCodeType) => {
      setGeneratedQr(qrCode);
      queryClient.invalidateQueries({ queryKey: ["/api/qr-codes"] });
      toast({
        title: "QR Code Generated!",
        description: "Your QR code has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    if (!qrData.trim()) {
      toast({
        title: "Input required",
        description: "Please enter the data for your QR code.",
        variant: "destructive",
      });
      return;
    }

    createQrMutation.mutate({
      type: qrType,
      content: qrData.trim(),
      foregroundColor,
      backgroundColor,
      size: size[0],
      logoUrl: logoUrl.trim() || undefined,
      style,
      errorCorrection,
      margin: margin[0],
    });
  };

  const qrTypes = [
    { value: "url", label: "Website URL" },
    { value: "text", label: "Plain Text" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone Number" },
    { value: "sms", label: "SMS Message" },
    { value: "wifi", label: "WiFi Network" },
    { value: "vcard", label: "Contact Card" },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Generator
            </CardTitle>
            <CardDescription>
              Create professional QR codes for any purpose
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="qr-type">QR Code Type</Label>
              <Select value={qrType} onValueChange={setQrType} data-testid="select-qr-type">
                <SelectTrigger>
                  <SelectValue placeholder="Select QR code type" />
                </SelectTrigger>
                <SelectContent>
                  {qrTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-data">
                {qrType === "url" && "Website URL"}
                {qrType === "text" && "Text Content"}
                {qrType === "email" && "Email Address"}
                {qrType === "phone" && "Phone Number"}
                {qrType === "sms" && "SMS Message"}
                {qrType === "wifi" && "WiFi Details"}
                {qrType === "vcard" && "Contact Information"}
              </Label>
              {qrType === "text" || qrType === "sms" || qrType === "vcard" ? (
                <Textarea
                  id="qr-data"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder={
                    qrType === "text" ? "Enter your text content..." :
                    qrType === "sms" ? "Enter SMS message..." :
                    "Enter contact details..."
                  }
                  rows={4}
                  data-testid="textarea-qr-data"
                />
              ) : (
                <Input
                  id="qr-data"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder={
                    qrType === "url" ? "https://example.com" :
                    qrType === "email" ? "user@example.com" :
                    qrType === "phone" ? "+1234567890" :
                    qrType === "wifi" ? "SSID:password:security" :
                    "Enter data..."
                  }
                  data-testid="input-qr-data"
                />
              )}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={createQrMutation.isPending} 
              className="w-full"
              data-testid="button-generate"
            >
              {createQrMutation.isPending ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Customization Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customization
            </CardTitle>
            <CardDescription>
              Customize the appearance of your QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Colors */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <Label>Colors</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foreground-color">Foreground</Label>
                  <div className="flex gap-2">
                    <Input
                      id="foreground-color"
                      type="color"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      className="w-16 h-10 p-1"
                      data-testid="input-foreground-color"
                    />
                    <Input
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background-color">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-16 h-10 p-1"
                      data-testid="input-background-color"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Size */}
            <div className="space-y-3">
              <Label>Size: {size[0]}px</Label>
              <Slider
                value={size}
                onValueChange={setSize}
                min={200}
                max={800}
                step={50}
                className="w-full"
                data-testid="slider-size"
              />
            </div>

            <Separator />

            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle} data-testid="select-style">
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Correction */}
            <div className="space-y-2">
              <Label htmlFor="error-correction">Error Correction Level</Label>
              <Select value={errorCorrection} onValueChange={setErrorCorrection} data-testid="select-error-correction">
                <SelectTrigger>
                  <SelectValue placeholder="Select error correction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Margin */}
            <div className="space-y-3">
              <Label>Margin: {margin[0]}px</Label>
              <Slider
                value={margin}
                onValueChange={setMargin}
                min={0}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-margin"
              />
            </div>

            <Separator />

            {/* Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                data-testid="input-logo-url"
              />
              <p className="text-xs text-muted-foreground">
                Add a logo to the center of your QR code
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
          <CardDescription>
            Your generated QR code will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            {generatedQr ? (
              <img
                src={`/api/qr-codes/${generatedQr.id}/image`}
                alt="Generated QR Code"
                className="w-full h-full object-contain p-4"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="text-center">
                <QrCode className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Generate a QR code to see preview</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled={!generatedQr}
              onClick={() => {
                if (generatedQr) {
                  const link = document.createElement('a');
                  link.href = `/api/qr-codes/${generatedQr.id}/image`;
                  link.download = `qr-code-${generatedQr.shortCode}.png`;
                  link.click();
                }
              }}
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled={!generatedQr}
              onClick={() => {
                if (generatedQr) {
                  const shortUrl = `${window.location.origin}/api/r/${generatedQr.shortCode}`;
                  navigator.clipboard.writeText(shortUrl);
                  toast({
                    title: "Link copied!",
                    description: "Short URL has been copied to clipboard.",
                  });
                }
              }}
              data-testid="button-copy"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
