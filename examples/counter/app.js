import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

const app = Fyr.createApp("counter-demo", {
  state: { count: 0, step: 1, history: ["Counter ready"] },
  computed: {
    headline() { return "A reactive counter"; },
    message() { return `Current value: ${this.state.count}`; },
    isMilestone() { return this.state.count !== 0 && this.state.count % 10 === 0; },
  },
  methods: {
    change(amount) {
      const delta = Number(amount) || 1;
      this.state.count += delta;
      this.state.history = [`Changed by ${delta > 0 ? "+" : ""}${delta}`, ...this.state.history].slice(0, 5);
    },
    reset() {
      this.state.count = 0;
      this.state.history = ["Reset to zero", ...this.state.history].slice(0, 5);
    },
  },
});
Fyr.start("counter-demo");
