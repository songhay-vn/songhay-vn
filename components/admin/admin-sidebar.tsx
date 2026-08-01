import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar"
import { OVERVIEW_TAB, POSTS_SUBMENU_TABS, type NavLeaf, type NavCountKey } from "@/app/admin/page-helpers"
import { AdminNavButton, AdminNavSubButton } from "@/components/admin/admin-nav-button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, FileText } from "lucide-react"
import { SidebarMenuSub, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

type AdminSidebarProps = React.ComponentProps<typeof Sidebar> & {
  contentTabs: NavLeaf[]
  settingsTabs: NavLeaf[]
  navCountByKey: Record<NavCountKey, number>
}

export function AdminSidebar({ contentTabs, settingsTabs, navCountByKey, ...props }: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-[4.25rem] flex items-center justify-center border-b border-sidebar-border px-6 group-data-[collapsible=icon]:px-0">
        <div className="w-full text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase group-data-[collapsible=icon]:hidden">
            Songhay CMS
          </p>
          <p className="hidden text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase group-data-[collapsible=icon]:block">
            SH
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <AdminNavButton tab={OVERVIEW_TAB} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Quản lý tin
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <span>
                        <FileText />
                        <span>Bài viết</span>
                      </span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {POSTS_SUBMENU_TABS.map((tab) => (
                        <AdminNavSubButton
                          key={tab.key}
                          tab={tab}
                          count={tab.countKey ? navCountByKey[tab.countKey] : undefined}
                        />
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  {contentTabs.map((tab) => (
                    <AdminNavButton
                      key={tab.key}
                      tab={tab}
                      count={tab.countKey ? navCountByKey[tab.countKey] : undefined}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarGroup>
          <SidebarGroupLabel>Cài đặt</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsTabs.map((tab) => (
                <AdminNavButton
                  key={tab.key}
                  tab={tab}
                  count={tab.countKey ? navCountByKey[tab.countKey] : undefined}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
