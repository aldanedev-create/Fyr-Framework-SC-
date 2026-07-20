let framework;

try {
  framework = await import("https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js");
} catch (error) {
  console.warn("jsDelivr is unavailable; using the local Fyr build instead.", error);
  framework = await import("../../dist/fyr.min.js");
}

const { Fyr } = framework;
const storageKey = "fyr-operations-dashboard";

const starterProjects = [
  makeProject("portal", "Customer portal", "Morgan", "On track", "High", 72),
  makeProject("analytics", "Analytics refresh", "Avery", "At risk", "High", 45),
  makeProject("mobile", "Mobile checkout", "Jordan", "Planning", "Medium", 18),
  makeProject("docs", "Developer documentation", "Taylor", "On track", "Low", 90)
];

const app = Fyr.createApp("ops-dashboard", {
  state: {
    workspaceName: "Northstar Operations",
    projects: starterProjects,
    visibleProjects: starterProjects,
    visibleCount: starterProjects.length,
    hasNoResults: false,
    searchQuery: "",
    statusFilter: "All",
    showCreatePanel: false,
    newProjectName: "",
    newProjectOwner: "",
    newProjectStatus: "On track",
    newProjectPriority: "Medium"
  },

  computed: {
    activeCount() {
      return this.state.projects.filter(project => project.status !== "Completed").length;
    },

    onTrackCount() {
      return this.state.projects.filter(project => project.status === "On track").length;
    },

    averageProgressLabel() {
      if (this.state.projects.length === 0) return "0%";
      const total = this.state.projects.reduce((sum, project) => sum + project.progress, 0);
      return Math.round(total / this.state.projects.length) + "%";
    },

  },

  methods: {
    toggleCreatePanel() {
      this.state.showCreatePanel = !this.state.showCreatePanel;
    },

    createProject() {
      const name = this.state.newProjectName.trim();
      const owner = this.state.newProjectOwner.trim();

      if (!name || !owner) {
        Fyr.notify.warning("Add both a project name and an owner.");
        return;
      }

      const id = "project-" + Date.now();
      const project = makeProject(
        id,
        name,
        owner,
        this.state.newProjectStatus,
        this.state.newProjectPriority,
        0
      );

      this.state.projects = [project, ...this.state.projects];
      updateVisibleProjects(this.state);
      this.state.newProjectName = "";
      this.state.newProjectOwner = "";
      this.state.showCreatePanel = false;
      persistProjects(this.state.projects);
      Fyr.notify.success(name + " was created.");
    },

    advanceProject(id) {
      const project = this.state.projects.find(item => item.id === id);
      if (!project) return;

      project.progress = Math.min(100, project.progress + 10);
      project.updatedLabel = "Updated just now";
      if (project.progress === 100) project.status = "Completed";
      updateVisibleProjects(this.state);
      persistProjects(this.state.projects);
      Fyr.notify.info(project.name + " is now " + project.progress + "% complete.");
    },

    completeProject(id) {
      const project = this.state.projects.find(item => item.id === id);
      if (!project) return;

      project.progress = 100;
      project.status = "Completed";
      project.updatedLabel = "Completed just now";
      updateVisibleProjects(this.state);
      persistProjects(this.state.projects);
      Fyr.notify.success(project.name + " is complete.");
    },

    saveProjects() {
      persistProjects(this.state.projects);
    },

    restoreProjects() {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      try {
        const projects = JSON.parse(saved);
        if (Array.isArray(projects)) {
          this.state.projects = projects;
          updateVisibleProjects(this.state);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    },

    applyFilters() {
      updateVisibleProjects(this.state);
    },

    exportSnapshot() {
      const payload = JSON.stringify({
        workspace: this.state.workspaceName,
        exportedAt: new Date().toISOString(),
        projects: this.state.projects
      }, null, 2);

      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fyr-project-snapshot.json";
      link.click();
      URL.revokeObjectURL(url);
      Fyr.notify.success("Project snapshot downloaded.");
    }
  }
});

Fyr.start("ops-dashboard");
app.controller.methods.restoreProjects.call(app.controller);

function persistProjects(projects) {
  localStorage.setItem(storageKey, JSON.stringify(projects));
}

function updateVisibleProjects(state) {
  const query = state.searchQuery.trim().toLowerCase();
  const visible = state.projects.filter(project => {
    const matchesQuery = !query ||
      project.name.toLowerCase().includes(query) ||
      project.owner.toLowerCase().includes(query);
    const matchesStatus = state.statusFilter === "All" || project.status === state.statusFilter;
    return matchesQuery && matchesStatus;
  });

  state.visibleProjects = visible;
  state.visibleCount = visible.length;
  state.hasNoResults = visible.length === 0;
}

function makeProject(id, name, owner, status, priority, progress) {
  return {
    id,
    name,
    owner,
    status,
    priority,
    progress,
    updatedLabel: "Updated today"
  };
}
