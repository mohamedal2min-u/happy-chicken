export default function HelloWorld() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '10px' }}>👋 Hello World!</h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.7 }}>
        ✅ السيرفر الآن موصول بالكامل ويقرأ التحديثات بنجاح فائق! 🎯🚀
      </p>
      <div style={{ marginTop: '30px', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }}>
        التوقيت الحالي: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
