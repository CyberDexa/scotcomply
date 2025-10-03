"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EMAIL_TYPES = [
  { value: "all", label: "All Types" },
  { value: "CERTIFICATE_EXPIRY", label: "Certificate Expiry" },
  { value: "REGISTRATION_EXPIRY", label: "Registration Expiry" },
  { value: "HMO_EXPIRY", label: "HMO Expiry" },
  { value: "INSPECTION_REMINDER", label: "Inspection Reminder" },
  { value: "ASSESSMENT_DUE", label: "Assessment Due" },
  { value: "WELCOME", label: "Welcome" },
  { value: "PASSWORD_RESET", label: "Password Reset" },
  { value: "DOCUMENT_SHARED", label: "Document Shared" },
  { value: "SYSTEM", label: "System" },
];

const EMAIL_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
  { value: "SCHEDULED", label: "Scheduled" },
];

export default function EmailHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: emailsData, isLoading, refetch } = trpc.email.getHistory.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    limit: 50,
  });

  const { data: stats } = trpc.email.getStats.useQuery();

  const resendMutation = trpc.email.resend.useMutation({
    onSuccess: () => {
      toast.success("Email resent successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to resend email: " + error.message);
    },
  });

  const deleteMutation = trpc.email.delete.useMutation({
    onSuccess: () => {
      toast.success("Email deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete email: " + error.message);
    },
  });

  const handleResend = async (emailId: string) => {
    if (confirm("Are you sure you want to resend this email?")) {
      resendMutation.mutate({ emailId });
    }
  };

  const handleDelete = async (emailId: string) => {
    if (confirm("Are you sure you want to delete this email from history?")) {
      deleteMutation.mutate({ id: emailId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SENT: { variant: "default" as const, color: "bg-green-100 text-green-800", icon: CheckCircle },
      FAILED: { variant: "destructive" as const, color: "bg-red-100 text-red-800", icon: XCircle },
      PENDING: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800", icon: Clock },
      SCHEDULED: { variant: "secondary" as const, color: "bg-blue-100 text-blue-800", icon: Calendar },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      CERTIFICATE_EXPIRY: "Certificate Expiry",
      REGISTRATION_EXPIRY: "Registration Expiry",
      HMO_EXPIRY: "HMO Expiry",
      INSPECTION_REMINDER: "Inspection Reminder",
      ASSESSMENT_DUE: "Assessment Due",
      WELCOME: "Welcome",
      PASSWORD_RESET: "Password Reset",
      DOCUMENT_SHARED: "Document Shared",
      SYSTEM: "System",
    };
    return typeMap[type] || type;
  };

  const filteredEmails = emailsData?.emails.filter((email) => {
    const matchesSearch =
      searchQuery === "" ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Email History</h1>
          <p className="text-gray-600 mt-1">View and manage all sent emails</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by recipient or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email History
                </CardTitle>
                <CardDescription>
                  {filteredEmails?.length || 0} email{filteredEmails?.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading emails...</p>
              </div>
            ) : filteredEmails && filteredEmails.length > 0 ? (
              <div className="space-y-3">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(email.status)}
                          <Badge variant="outline">{getTypeName(email.type)}</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{email.subject}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            To: {email.to}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {email.sentAt
                              ? format(new Date(email.sentAt), "PPp")
                              : email.scheduledFor
                              ? `Scheduled: ${format(new Date(email.scheduledFor), "PPp")}`
                              : format(new Date(email.createdAt), "PPp")}
                          </span>
                        </div>
                        {email.errorMessage && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error: {email.errorMessage}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {email.status === "FAILED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(email.id)}
                            disabled={resendMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Resend
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(email.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emails Found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "No emails match your filters"
                    : "Email history will appear here once emails are sent"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
