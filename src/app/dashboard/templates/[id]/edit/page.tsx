"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, FileText, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "tenant_notices", label: "Tenant Notices" },
  { value: "compliance_reports", label: "Compliance Reports" },
  { value: "maintenance", label: "Maintenance" },
  { value: "legal", label: "Legal" },
  { value: "custom", label: "Custom" },
];

const SUGGESTED_VARIABLES = [
  { name: "tenantName", description: "Tenant's full name" },
  { name: "tenantAddress", description: "Tenant's address" },
  { name: "propertyAddress", description: "Property address" },
  { name: "landlordName", description: "Landlord's name" },
  { name: "landlordEmail", description: "Landlord's email" },
  { name: "landlordPhone", description: "Landlord's phone" },
  { name: "date", description: "Current date" },
  { name: "rentAmount", description: "Monthly rent amount" },
  { name: "depositAmount", description: "Security deposit amount" },
  { name: "leaseStartDate", description: "Lease start date" },
  { name: "leaseEndDate", description: "Lease end date" },
  { name: "noticeDate", description: "Notice date" },
  { name: "effectiveDate", description: "Effective date" },
];

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("custom");
  const [content, setContent] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("edit");

  const { data: template, isLoading } = trpc.template.getById.useQuery({
    id: templateId,
  });

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully!");
      router.push("/dashboard/templates");
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category);
      setContent(template.content);
    }
  }, [template]);

  const handleInsertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setContent((prev) => prev + variable);
    toast.success(`Inserted variable: ${variableName}`);
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const renderPreview = (): string => {
    let rendered = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || `{{${key}}}`);
    });
    return rendered;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Template content is required");
      return;
    }

    const variables = extractVariables(content);

    updateMutation.mutate({
      id: templateId,
      name: name.trim(),
      description: description.trim() || undefined,
      category: category as "tenant_notices" | "compliance_reports" | "maintenance" | "legal" | "custom",
      content: content.trim(),
      variables: variables,
    });
  };

  const detectedVariables = extractVariables(content);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Template not found</p>
          <Link href="/dashboard/templates">
            <Button className="mt-4">Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600 mt-1">
              Modify your document template and its variables
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  Configure your template&apos;s basic information and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rent Increase Notice"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this template"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">
                        <FileText className="w-4 h-4 mr-2" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="space-y-2">
                      <Label htmlFor="content">Template Content *</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter your template content here. Use {{variableName}} for dynamic content."
                        className="min-h-[400px] font-mono text-sm"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Use double curly braces for variables: {"{{variableName}}"}
                      </p>
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                        {detectedVariables.length > 0 && (
                          <div className="mb-4 space-y-2 pb-4 border-b">
                            <p className="text-sm font-medium text-gray-700">
                              Fill in variables for preview:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {detectedVariables.map((variable) => (
                                <Input
                                  key={variable}
                                  placeholder={variable}
                                  value={previewData[variable] || ""}
                                  onChange={(e) =>
                                    setPreviewData({
                                      ...previewData,
                                      [variable]: e.target.value,
                                    })
                                  }
                                  className="text-sm"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                          {content ? renderPreview() : (
                            <p className="text-gray-400 italic">
                              No content to preview yet. Switch to Edit tab to add content.
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {detectedVariables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Detected Variables ({detectedVariables.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {detectedVariables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Suggested Variables
                </CardTitle>
                <CardDescription>
                  Click to insert into your template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {SUGGESTED_VARIABLES.map((variable) => (
                    <button
                      key={variable.name}
                      onClick={() => handleInsertVariable(variable.name)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                        {"{{" + variable.name + "}}"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {variable.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Use {"{{variableName}}"} for dynamic content</p>
                <p>• Variables are case-sensitive</p>
                <p>• Preview your template before saving</p>
                <p>• Include Scottish legal references where applicable</p>
                <p>• Keep formatting simple for PDF generation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
