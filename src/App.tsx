import React from "react";

export default function App() {
  return (
    <main style={{fontFamily:"Arial,sans-serif",minHeight:"100vh",display:"grid",placeItems:"center",background:"#f8fafc",padding:24}}>
      <section style={{maxWidth:680,textAlign:"center",background:"white",padding:40,borderRadius:20,boxShadow:"0 10px 35px rgba(15,23,42,.08)"}}>
        <div style={{fontSize:28,fontWeight:800,color:"#4f46e5"}}>FreelanceHub</div>
        <h1>Full-Stack Project Ready</h1>
        <p style={{color:"#64748b",lineHeight:1.6}}>The real application is served by the Node.js + Express backend. Run <b>npm install</b> and <b>npm run dev</b>, then open <b>http://localhost:3000</b>.</p>
        <p style={{color:"#64748b"}}>The backend automatically seeds clients, projects, tasks, invoices, expenses and notifications into SQLite.</p>
      </section>
    </main>
  );
}
