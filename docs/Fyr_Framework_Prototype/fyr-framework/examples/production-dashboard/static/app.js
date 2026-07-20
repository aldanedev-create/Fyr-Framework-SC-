Fyr.controller("dashboard", {
  state: {
    authenticated: false, busy: false, showComposer: false,
    credentials: { email: "admin@fyr.dev", password: "Admin123!" },
    user: { name: "", role: "" }, stats: { tasks: 0, completed: 0, users: 0, runtime: "" }, tasks: [],
    draft: { title: "", description: "", priority: "medium" },
    wasm: { left: 21, right: 21, result: "Not loaded" },
    python: { number: 12, result: "Lazy runtime not loaded" }
  },
  async mounted() {
    try { this.user = await Fyr.http.get("/api/auth/me"); this.authenticated = true; await this.refresh(); } catch (_) {}
  },
  methods: {
    async login() {
      this.busy = true;
      try { this.user = await Fyr.http.post("/api/auth/login", this.credentials); this.authenticated = true; await this.refresh(); Fyr.notify("Signed in", "success"); }
      finally { this.busy = false; }
    },
    async logout() { await Fyr.http.post("/api/auth/logout"); this.authenticated = false; },
    async refresh() {
      const [tasks, stats] = await Promise.all([Fyr.http.get("/api/tasks"), Fyr.action("dashboard.stats")]);
      this.tasks = tasks.items; this.stats = stats;
    },
    async createTask() {
      const task = await Fyr.http.post("/api/tasks", this.draft); this.tasks.unshift(task);
      this.draft = { title: "", description: "", priority: "medium" }; this.showComposer = false; await this.refresh();
    },
    async setStatus(id, status) { await Fyr.http.patch(`/api/tasks/${id}`, { status }); await this.refresh(); },
    async removeTask(id) { await Fyr.http.delete(`/api/tasks/${id}`); await this.refresh(); },
    async runWasm() {
      if (!Fyr.wasm.has("engine")) await Fyr.wasm.load("engine", "/fyr/fyr-engine.wasm");
      this.wasm.result = `Result: ${Fyr.wasm.call("engine", "add", Number(this.wasm.left), Number(this.wasm.right))}`;
    },
    async runPython() {
      this.python.result = "Loading Python runtime...";
      const value = Number(this.python.number);
      const result = await Fyr.python.run(`${value} ** 2`);
      this.python.result = `Result: ${result}`;
    }
  }
});
