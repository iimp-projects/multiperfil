export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-500 text-sm font-medium">Usuarios Activos</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">--</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-500 text-sm font-medium">Mensajes Enviados</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">--</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-500 text-sm font-medium">Alertas Vigentes</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">--</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-500 text-sm font-medium">Grupos Creados</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">--</div>
        </div>
      </div>
    </div>
  );
}
