import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

const app = Fyr.createApp("fyr-classroom", {
  state: {
    course: { code: "CS-101", name: "Loading classroom…", teacher: "", period: "", meeting: "" },
    students: [], assignments: [], visibleAssignments: [], announcements: [],
    role: "student", activeView: "stream", isStream: true, isClasswork: false, isPeople: false,
    isStudent: true, isTeacher: false, assignmentCount: 0, studentCount: 0, announcementCount: 0, pendingCount: 0,
    assignmentSearch: "", assignmentFilter: "all", visibleAssignmentCount: 0, hasNoAssignments: false, showAssignmentForm: false,
    announcementDraft: "", newAssignmentTitle: "", newAssignmentTopic: "", newAssignmentDue: "",
    newAssignmentPoints: "10", newAssignmentDescription: "",
  },

  methods: {
    async loadClassroom() {
      const response = await Fyr.http.get("/api/classroom");
      if (!response.ok) return Fyr.notify.error("Could not load the classroom data.");
      this.state.course = response.data.course;
      this.state.students = response.data.students;
      this.state.assignments = response.data.assignments;
      this.state.announcements = response.data.announcements;
      refreshClassroom(this.state);
    },
    selectView(view) { this.state.activeView = view; refreshView(this.state); },
    setRole() { refreshView(this.state); Fyr.notify.info(`Switched to ${this.state.role} demo view.`); },
    toggleAssignmentForm() { this.state.showAssignmentForm = !this.state.showAssignmentForm; },
    filterAssignments() { updateVisibleAssignments(this.state); },

    async submitAssignment(id) {
      const response = await Fyr.http.post(`/api/assignments/${id}/submit`, {});
      if (!response.ok) return Fyr.notify.error(response.data?.error || "Could not submit this assignment.");
      replaceAssignment(this.state, response.data.assignment);
      Fyr.notify.success("Assignment turned in.");
    },
    async returnFullCredit(id) {
      const assignment = this.state.assignments.find(item => item.id === id);
      if (!assignment) return;
      const response = await Fyr.http.post(`/api/assignments/${id}/grade`, { grade: assignment.points });
      if (!response.ok) return Fyr.notify.error(response.data?.error || "Could not return this assignment.");
      replaceAssignment(this.state, response.data.assignment);
      Fyr.notify.success("Assignment returned with full credit.");
    },
    async createAssignment() {
      const response = await Fyr.http.post("/api/assignments", {
        title: this.state.newAssignmentTitle, topic: this.state.newAssignmentTopic,
        due: this.state.newAssignmentDue, points: this.state.newAssignmentPoints,
        description: this.state.newAssignmentDescription,
      });
      if (!response.ok) return Fyr.notify.error(response.data?.error || "Could not create the assignment.");
      this.state.assignments = [response.data.assignment, ...this.state.assignments];
      refreshClassroom(this.state);
      this.state.newAssignmentTitle = ""; this.state.newAssignmentTopic = ""; this.state.newAssignmentDue = "";
      this.state.newAssignmentPoints = "10"; this.state.newAssignmentDescription = ""; this.state.showAssignmentForm = false;
      Fyr.notify.success("Assignment published.");
    },
    async publishAnnouncement() {
      const message = this.state.announcementDraft.trim();
      if (!message) return Fyr.notify.warning("Write an announcement before posting.");
      const response = await Fyr.http.post("/api/announcements", { message });
      if (!response.ok) return Fyr.notify.error(response.data?.error || "Could not post the announcement.");
      this.state.announcements = [response.data.announcement, ...this.state.announcements];
      refreshCounts(this.state);
      this.state.announcementDraft = "";
      Fyr.notify.success("Announcement posted.");
    },
  },
});

Fyr.start("fyr-classroom");
app.controller.methods.loadClassroom.call(app.controller);

function updateVisibleAssignments(state) {
  const query = state.assignmentSearch.trim().toLowerCase();
  const visible = state.assignments.filter(assignment => {
    const matchesSearch = !query || assignment.title.toLowerCase().includes(query) || assignment.topic.toLowerCase().includes(query);
    const matchesStatus = state.assignmentFilter === "all" || assignment.status === state.assignmentFilter;
    return matchesSearch && matchesStatus;
  });
  state.visibleAssignments = visible;
  state.visibleAssignmentCount = visible.length;
  state.hasNoAssignments = visible.length === 0;
}

function replaceAssignment(state, updated) {
  state.assignments = state.assignments.map(item => item.id === updated.id ? updated : item);
  refreshClassroom(state);
}

function refreshClassroom(state) {
  refreshView(state);
  refreshCounts(state);
  updateVisibleAssignments(state);
}

function refreshView(state) {
  state.isStream = state.activeView === "stream";
  state.isClasswork = state.activeView === "classwork";
  state.isPeople = state.activeView === "people";
  state.isStudent = state.role === "student";
  state.isTeacher = state.role === "teacher";
}

function refreshCounts(state) {
  state.assignmentCount = state.assignments.length;
  state.studentCount = state.students.length;
  state.announcementCount = state.announcements.length;
  state.pendingCount = state.assignments.filter(item => !item.submitted).length;
}
