export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#fafafa',
        color: '#202124',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>404</h1>
        <p style={{ marginTop: 12 }}>页面不存在</p>
      </div>
    </main>
  );
}
