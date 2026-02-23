import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Clock, LogOut, Layers, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demoRepositories, getAllRepositories, Repository } from "@/data/demoData";
import { loadGeneratedManifest, loadGeneratedRepo } from "@/data/loader";
import { getStoredUser, clearStoredUser } from "@/components/EmailGate";

const languageIcons: Record<string, string> = {
  TypeScript: "TS",
  Python: "PY",
  JavaScript: "JS",
  Go: "GO",
};

export function RepoSelection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "recent">("all");
  const [loaded, setLoaded] = useState(false);

  // Load generated repos on mount
  useEffect(() => {
    loadGeneratedManifest().then(async (manifest) => {
      await Promise.all(manifest.map((id) => loadGeneratedRepo(id)));
      setLoaded(true);
    });
  }, []);

  const allRepos = getAllRepositories();
  const filteredRepos = allRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRepoClick = (repo: Repository) => {
    navigate(`/loading/${repo.id}`);
  };

  const user = getStoredUser();
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleSignOut = () => {
    clearStoredUser();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Legend</span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.name ?? "User"}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Repositories</h1>
            <p className="text-muted-foreground">
              Select a repository to visualize its architecture
            </p>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === "recent" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedFilter("recent")}
              >
                <Clock className="w-4 h-4 mr-1" />
                Recent
              </Button>
            </div>
          </div>

          {/* Repository grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <RepoCard repo={repo} onClick={() => handleRepoClick(repo)} />
              </motion.div>
            ))}
          </div>

          {/* Empty state */}
          {filteredRepos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No repositories found</h3>
              <p className="text-muted-foreground">
                Try searching with different terms
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

interface RepoCardProps {
  repo: Repository;
  onClick: () => void;
}

function RepoCard({ repo, onClick }: RepoCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-xl border bg-card hover:border-primary/30 hover:legend-shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">{repo.owner}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {repo.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {repo.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {/* Language badge */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: repo.languageColor }}
          />
          <span className="text-muted-foreground">{repo.language}</span>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="w-3.5 h-3.5" />
          <span>{repo.stars.toLocaleString()}</span>
        </div>

        {/* Updated */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{repo.lastUpdated}</span>
        </div>
      </div>
    </button>
  );
}
