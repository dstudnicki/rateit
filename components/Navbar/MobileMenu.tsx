import { Button } from "@/components/ui/button";
import { Bell, Briefcase, HelpCircle, Home, LogOut, MessageSquare, Settings, User, Users, X } from "lucide-react";

interface MobileMenuProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (mobileMenuOpen: boolean) => void;
}

export function MobileMenu({ mobileMenuOpen, setMobileMenuOpen }: MobileMenuProps) {

    return (
      <>
          {mobileMenuOpen && (
              <div className="sm:hidden border-t py-4">
                  <nav className="flex flex-col gap-1">
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <Home className="h-5 w-5" />
                          <span className="font-medium">Home</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <Users className="h-5 w-5" />
                          <span className="font-medium">Network</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <Briefcase className="h-5 w-5" />
                          <span className="font-medium">Jobs</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <MessageSquare className="h-5 w-5" />
                          <span className="font-medium">Messages</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <Bell className="h-5 w-5" />
                          <span className="font-medium">Notifications</span>
                      </Button>

                      <div className="h-px bg-border my-2" />

                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <User className="h-5 w-5" />
                          <span className="font-medium">View Profile</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="h-5 w-5" />
                          <span className="font-medium">Settings & Privacy</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                          <HelpCircle className="h-5 w-5" />
                          <span className="font-medium">Help Center</span>
                      </Button>

                      <div className="h-px bg-border my-2" />

                      <Button
                          variant="ghost"
                          className="justify-start gap-3 h-12 text-destructive hover:text-destructive"
                          onClick={() => setMobileMenuOpen(false)}
                      >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Log Out</span>
                      </Button>
                  </nav>
              </div>
          )}
      </>
    )
}