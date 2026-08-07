import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, workspace, and team.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="first">First name</Label>
                  <Input id="first" defaultValue="Jordan" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last">Last name</Label>
                  <Input id="last" defaultValue="Smith" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" defaultValue="jordan@acmesecurity.com" />
              </div>
              <Button className="mt-2 w-fit">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input id="workspace-name" defaultValue="Acme Security Group" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="workspace-domain">Report footer branding</Label>
                <Input id="workspace-domain" placeholder="Custom footer text on exported PDFs" />
              </div>
              <Button className="mt-2 w-fit">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="max-w-xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Team members</CardTitle>
              <Button size="sm">Invite member</Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                { name: "Jordan Smith", role: "Admin" },
                { name: "Marcus Reyes", role: "Author" },
                { name: "Priya Nair", role: "Reviewer" },
              ].map((member) => (
                <div key={member.name} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {["Report approved", "Review requested", "Weekly usage summary", "Product updates"].map((label) => (
                <label key={label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                  {label}
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
