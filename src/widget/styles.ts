export const widgetCss = `
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #142015;
  background: #f7f8f3;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.shell {
  min-height: 100vh;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(83, 252, 24, 0.12), transparent 190px),
    #f7f8f3;
}

header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 24px;
  line-height: 1.1;
}

header p,
.status p {
  color: #56624f;
  font-size: 14px;
}

.list {
  display: grid;
  gap: 10px;
}

.item {
  border: 1px solid #dfe8d6;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  padding: 14px;
}

.item h2 {
  font-size: 18px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.eyebrow {
  color: #278200;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 0;
}

dt {
  color: #68735f;
  font-size: 12px;
}

dd {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.status {
  display: grid;
  align-content: center;
  gap: 8px;
}

@media (max-width: 520px) {
  header {
    display: block;
  }

  header p {
    margin-top: 4px;
  }

  dl {
    grid-template-columns: 1fr;
  }
}
`;

