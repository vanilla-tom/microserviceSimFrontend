<template>
  <div class="shell">
    <header class="shell-header">
      <div class="brand">
        <div class="brand-mark">MS</div>
        <div>
          <strong>微服务仿真平台</strong>
          <p>Simulation-aligned monitoring dashboard</p>
        </div>
      </div>
    </header>

    <main class="shell-main">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
  font-family: "Noto Sans SC", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top, rgba(125, 211, 252, 0.14), transparent 22%),
    linear-gradient(180deg, #edf4fb 0%, #f7fafc 50%, #eef2f7 100%);
  color: #0f172a;
}

a {
  color: inherit;
}

.shell {
  min-height: 100vh;
}

.shell-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.84);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand strong {
  display: block;
  font-size: 18px;
}

.brand p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: #e0f2fe;
  background: linear-gradient(135deg, #075985 0%, #0f172a 100%);
  font-weight: 700;
}

.nav-links a {
  padding: 10px 14px;
  border-radius: 999px;
  text-decoration: none;
  color: #475569;
}

.nav-links a.router-link-active {
  background: #e2e8f0;
  color: #0f172a;
}

.shell-main {
  padding: 28px;
}

@media (max-width: 720px) {
  .shell-header,
  .shell-main {
    padding: 18px;
  }
}
</style>
