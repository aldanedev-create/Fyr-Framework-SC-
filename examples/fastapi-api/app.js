import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

const app = Fyr.createApp("fastapi-demo", {
  state: { items: [], visibleItems: [], draft: "", priority: "medium", status: "Loading API…" },
  methods: {
    async load() { const response = await Fyr.http.get("/api/items"); if (!response.ok) return this.state.status = "API request failed"; this.state.items = response.data.items; this.state.visibleItems = response.data.items; this.state.status = "FastAPI is connected."; },
    async addItem() { const title = this.state.draft.trim(); if (!title) return; const response = await Fyr.http.post("/api/items", { title, priority: this.state.priority }); if (!response.ok) return Fyr.notify.error("Could not create item"); this.state.items = [response.data.item, ...this.state.items]; this.state.visibleItems = this.state.items; this.state.draft = ""; },
    async toggleItem(id) { const response = await Fyr.http.patch(`/api/items/${id}`, {}); if (!response.ok) return Fyr.notify.error("Could not update item"); this.state.items = this.state.items.map(item => item.id === id ? response.data.item : item); this.state.visibleItems = this.state.items; },
  },
});
Fyr.start("fastapi-demo"); app.controller.methods.load.call(app.controller);
