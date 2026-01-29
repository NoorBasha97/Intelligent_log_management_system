// import React from 'react';

// const StatCard = ({ icon: Icon, label, value, colorClass, trend }) => {
//   return (
//     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
//       <div className={`p-4 rounded-lg ${colorClass} bg-opacity-10`}>
//         <Icon className={`${colorClass.replace('bg-', 'text-')}`} size={24} />
//       </div>
//       <div>
//         <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
//         <div className="flex items-baseline gap-2">
//           <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
//           {trend && (
//             <span className={`text-xs font-bold ${trend.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
//               {trend}
//             </span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StatCard;