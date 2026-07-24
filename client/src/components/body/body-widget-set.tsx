import type { ComponentType, CSSProperties, ReactNode } from "react";
import { TbActivity, TbBed, TbBrain, TbDroplet, TbHeartbeat, TbLungs, TbMoonStars, TbTemperature, TbWalk } from "react-icons/tb";
import { bodyMetrics } from "./body-widget-data";
import { defineWidget } from "./module-grid";

type Accent={main:string;medium:string;soft:string};
type IconType=ComponentType<{className?:string;style?:CSSProperties}>;
const fontStack='Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
function accent(color:string):Accent{return {main:color,medium:`color-mix(in oklch, ${color} 48%, white)`,soft:`color-mix(in oklch, ${color} 11%, white)`}}
const colors={
  recovery:accent("oklch(58% 0.20 27)"),sleep:accent("oklch(58% 0.18 285)"),heart:accent("oklch(58% 0.19 15)"),
  steps:accent("oklch(58% 0.18 145)"),hrv:accent("oklch(58% 0.18 260)"),stress:accent("oklch(60% 0.17 52)"),
  oxygen:accent("oklch(59% 0.16 220)"),breath:accent("oklch(58% 0.15 185)"),temperature:accent("oklch(61% 0.18 75)"),strain:accent("oklch(57% 0.18 325)"),
};

function Card({title,meta,icon:Icon,color,children}:{title:string;meta:string;icon:IconType;color:Accent;children:ReactNode}){
  return <article className="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-[#e4e7eb] bg-white p-5 text-[#18202a] shadow-[0_8px_22px_rgba(24,32,42,.055)]" style={{fontFamily:fontStack}}>
    <header className="relative flex shrink-0 items-start justify-between rounded-xl outline outline-1 outline-dashed outline-amber-400"><div><h3 className="text-[15px] font-semibold leading-none tracking-[-0.015em]">{title}</h3><p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">{meta}</p></div><Icon className="h-6 w-6 shrink-0" style={{color:color.main}}/><span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">top zone</span></header>
    <div className="relative mt-4 h-[176px] min-h-0 shrink-0 rounded-xl outline outline-1 outline-dashed outline-fuchsia-400">
      <span className="pointer-events-none absolute right-1 top-1 z-20 rounded bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">free center zone</span>
      {children}
    </div>
    <div className="relative mt-2 grid h-11 shrink-0 place-items-center rounded-xl outline outline-1 outline-dashed outline-cyan-400">
      <span className="text-[9px] font-semibold text-cyan-700">free bottom zone</span>
    </div>
  </article>;
}
function Metric({value,unit,label,align="left"}:{value:string;unit?:string;label?:string;align?:"left"|"right"}){
  return <div className={align==="right"?"text-right":""}>{label?<p className="mb-0.5 text-[10px] font-medium leading-none text-[#747d89]">{label}</p>:null}<p className="whitespace-nowrap font-semibold leading-none tracking-[-0.025em] tabular-nums"><span className="text-[18px]">{value}</span>{unit?<span className="ml-1 text-[10px] font-medium text-[#747d89]">{unit}</span>:null}</p></div>;
}
function BigMetric({value,unit}:{value:string;unit?:string}){return <p className="flex items-baseline"><strong className="text-[30px] font-semibold leading-none tracking-[-0.045em] tabular-nums">{value}</strong>{unit?<span className="ml-1 text-[11px] font-medium text-[#747d89]">{unit}</span>:null}</p>}
function smoothPath(values:number[],width=260,height=72,pad=5){
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
  const pts=values.map((v,i)=>({x:pad+i/(values.length-1)*(width-pad*2),y:height-pad-(v-min)/span*(height-pad*2)}));
  const d=pts.slice(1).reduce((path,point,index)=>{const previous=pts[index],mid=(previous.x+point.x)/2;return `${path} C ${mid.toFixed(1)} ${previous.y.toFixed(1)}, ${mid.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`},`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`);
  return {d,last:pts.at(-1)!};
}
function Line({values,color,height=72}:{values:number[];color:Accent;height?:number}){const {d,last}=smoothPath(values,260,height);return <svg viewBox={`0 0 260 ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none"><path d={d} fill="none" stroke={color.main} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx={last.x} cy={last.y} r="4.5" fill="white" stroke={color.main} strokeWidth="3"/></svg>}

function Recovery(){
  const data=bodyMetrics.recovery;
  return <div className="flex h-full flex-col"><div className="space-y-3">{data.inputs.map((item,i)=><div key={item.label}><div className="mb-1 flex justify-between text-[11px]"><span className="font-medium">{item.label}</span><span className="font-semibold tabular-nums">{item.value}</span></div><div className="h-[15px] overflow-hidden rounded-[7px]" style={{backgroundColor:colors.recovery.soft}}><div className="h-full rounded-[7px]" style={{width:`${item.value}%`,backgroundColor:i===0?colors.recovery.main:colors.recovery.medium}}/></div></div>)}</div><div className="mt-auto flex items-end justify-between pt-3"><span className="text-[11px] text-[#747d89]">{data.delta>=0?"+":""}{data.delta}% Â· 7d</span><BigMetric value={String(data.score)} unit="%"/></div></div>;
}
function Sleep(){
  const data=bodyMetrics.sleep;
  const stageStyle={awake:{height:22,color:colors.sleep.soft},light:{height:42,color:colors.sleep.medium},deep:{height:66,color:colors.sleep.main},rem:{height:54,color:`color-mix(in oklch, ${colors.sleep.main} 72%, white)`}} as const;
  return <div className="flex h-full flex-col"><div className="flex h-[74px] items-center gap-1.5">{data.stages.map((stage,i)=>{const style=stageStyle[stage.stage];return <span key={i} className="rounded-[6px]" title={`${stage.stage}: ${stage.minutes} min`} style={{flex:stage.minutes,height:style.height,backgroundColor:style.color}}/>})}</div><div className="mt-2 flex justify-between text-[10px] text-[#747d89]"><span>23:18</span><span>07:06</span></div><div className="mt-auto grid grid-cols-3 gap-3 pt-3"><Metric label="Deep" value={`${Math.floor(data.deepMinutes/60)}h ${data.deepMinutes%60}`}/><Metric label="REM" value={`${Math.floor(data.remMinutes/60)}h ${data.remMinutes%60}`}/><Metric label="Awake" value={String(data.awakeMinutes)} unit="m" align="right"/></div></div>;
}
function Heart(){
  const data=bodyMetrics.heart;
  return <div className="grid h-full grid-rows-[1fr_auto]"><div className="grid min-h-0 grid-cols-[1fr_74px] items-center gap-4"><div className="h-[94px]"><Line values={[...data.samples]} color={colors.heart} height={72}/></div><BigMetric value={String(data.current)} unit="bpm"/></div><div className="flex justify-between pt-3"><Metric label="Resting" value={String(data.resting)} unit="bpm"/><Metric label="High" value={String(data.high)} unit="bpm" align="right"/></div></div>;
}
function Steps(){
  const data=bodyMetrics.steps,progress=Math.min(1,data.total/data.goal),c=2*Math.PI*38;
  return <div className="grid h-full grid-cols-[1.15fr_.85fr] items-center gap-4"><div className="relative grid place-items-center"><svg viewBox="0 0 100 100" className="h-[122px] w-[122px] -rotate-90"><circle cx="50" cy="50" r="38" fill="none" stroke={colors.steps.soft} strokeWidth="10"/><circle cx="50" cy="50" r="38" fill="none" stroke={colors.steps.main} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c*progress} ${c}`}/></svg><div className="absolute text-center"><p className="text-[25px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{data.total.toLocaleString()}</p><p className="mt-1 text-[10px] text-[#747d89]">of {data.goal.toLocaleString()}</p></div></div><div className="space-y-5"><Metric label="Distance" value={String(data.distanceKm)} unit="km"/><Metric label="Active" value={String(data.activeCalories)} unit="kcal"/></div></div>;
}
function Hrv(){
  const data=bodyMetrics.hrv;
  return <div className="flex h-full flex-col"><div className="flex items-start justify-between"><BigMetric value={String(data.current)} unit="ms"/><span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{color:colors.hrv.main,backgroundColor:colors.hrv.soft}}>+{data.deltaPercent}%</span></div><div className="mt-2 flex h-[72px] items-end gap-2">{data.samples.map((v,i)=><div key={i} className="flex h-full flex-1 items-end"><span className="w-full rounded-[6px]" title={`${v} ms`} style={{height:`${v-18}px`,backgroundColor:i===data.samples.length-1?colors.hrv.main:colors.hrv.soft}}/></div>)}</div><div className="mt-auto flex justify-between pt-2 text-[10px] text-[#747d89]"><span>7 days ago</span><span>Average {data.average} ms</span></div></div>;
}
function Stress(){
  const data=bodyMetrics.stress;
  return <div className="grid h-full grid-rows-[1fr_auto]"><div className="grid min-h-0 grid-cols-[1fr_70px] items-center gap-4"><div className="h-[94px]"><Line values={[...data.samples]} color={colors.stress}/></div><div><BigMetric value={String(data.current)}/><p className="mt-1 text-[10px] text-[#747d89]">current</p></div></div><div className="flex justify-between pt-3"><Metric label="Peak" value={String(data.peak)}/><Metric label="Calm" value={String(data.calmMinutes)} unit="min" align="right"/></div></div>;
}
function Oxygen(){
  const data=bodyMetrics.oxygen;
  return <div className="grid h-full grid-cols-[.8fr_1.2fr] items-center gap-5"><div><BigMetric value={String(data.average)} unit="%"/><p className="mt-1 text-[10px] text-[#747d89]">{data.drops===0?"No drops":"Drops detected"}</p></div><div><div className="grid grid-cols-4 gap-2">{data.samples.map((v,i)=><span key={i} className="aspect-square rounded-[6px]" title={`${v}%`} style={{backgroundColor:`color-mix(in oklch, ${colors.oxygen.main} ${30+(v-data.low)*20}%, white)`}}/>)}</div><div className="mt-3 flex justify-between"><Metric label="Low" value={String(data.low)} unit="%"/><Metric label="High" value={String(data.high)} unit="%" align="right"/></div></div></div>;
}
function Breath(){
  const data=bodyMetrics.respiratory;
  return <div className="grid h-full grid-rows-[1fr_auto]"><div className="h-[104px]"><Line values={[...data.samples]} color={colors.breath}/></div><div className="flex items-end justify-between pt-3"><Metric label="Range" value={`${data.low}-${data.high}`} unit="rpm"/><BigMetric value={String(data.average)} unit="rpm"/></div></div>;
}
function Temperature(){
  const data=bodyMetrics.temperature;
  return <div className="flex h-full flex-col"><div className="flex items-start justify-between"><BigMetric value={`${data.latest>=0?"+":""}${data.latest}`} unit="C"/><span className="text-[10px] text-[#747d89]">baseline 0</span></div><div className="relative mt-4 h-[54px]"><div className="absolute left-0 right-0 top-1/2 h-[12px] -translate-y-1/2 rounded-[6px]" style={{backgroundColor:colors.temperature.soft}}/><div className="relative flex h-full items-center justify-between">{data.deviations.map((v,i)=><span key={i} className="rounded-full border-2 border-white shadow-sm" title={`${v} C`} style={{width:i===data.deviations.length-1?14:9,height:i===data.deviations.length-1?14:9,backgroundColor:i===data.deviations.length-1?colors.temperature.main:colors.temperature.medium,transform:`translateY(${-v*45}px)`}}/>)}</div></div><div className="mt-auto flex justify-between text-[10px] text-[#747d89]"><span>-1</span><span>7d avg {data.average}</span><span>+1</span></div></div>;
}
function Strain(){
  const data=bodyMetrics.strain;
  return <div className="grid h-full grid-cols-[1fr_auto] items-end gap-5"><div className="space-y-3">{data.activities.map(activity=><div key={activity.label}><div className="mb-1 flex justify-between text-[10px]"><span>{activity.label}</span><span>{activity.load}</span></div><div className="h-3 rounded-[6px]" style={{backgroundColor:colors.strain.soft}}><div className="h-full rounded-[6px]" style={{width:`${Math.min(100,activity.load/6*100)}%`,backgroundColor:colors.strain.main}}/></div></div>)}</div><div className="pb-1"><BigMetric value={String(data.score)}/><p className="mt-1 text-right text-[10px] text-[#747d89]">{data.score>=data.targetLow&&data.score<=data.targetHigh?"productive":"outside target"}</p></div></div>;
}

const definitions=[
  {id:"recovery",label:"Recovery",icon:TbActivity,color:colors.recovery,meta:"Updated today at 08:42",visual:<Recovery/>},
  {id:"sleep",label:"Sleep",icon:TbMoonStars,color:colors.sleep,meta:"Last night - 7h 48m",visual:<Sleep/>},
  {id:"heart-rate",label:"Heart rate",icon:TbHeartbeat,color:colors.heart,meta:"Live - updated now",visual:<Heart/>},
  {id:"steps",label:"Steps",icon:TbWalk,color:colors.steps,meta:"Today - 14:32",visual:<Steps/>},
  {id:"hrv",label:"HRV",icon:TbBrain,color:colors.hrv,meta:"7-day recovery signal",visual:<Hrv/>},
  {id:"stress",label:"Stress",icon:TbBed,color:colors.stress,meta:"Today - continuous",visual:<Stress/>},
  {id:"oxygen",label:"Blood oxygen",icon:TbDroplet,color:colors.oxygen,meta:"Last night - 12 samples",visual:<Oxygen/>},
  {id:"respiratory",label:"Respiratory rate",icon:TbLungs,color:colors.breath,meta:"Last night average",visual:<Breath/>},
  {id:"temperature",label:"Temperature",icon:TbTemperature,color:colors.temperature,meta:"Compared with baseline",visual:<Temperature/>},
  {id:"strain",label:"Daily strain",icon:TbActivity,color:colors.strain,meta:"Today - active load",visual:<Strain/>},
] as const;
export const bodyWidgetSet=definitions.map((item)=>defineWidget({id:`body-${item.id}`,label:item.label,icon:item.icon,defaultW:1,defaultH:1,visualizations:[{id:"default",label:"Default"}],render:()=><Card title={item.label} meta={item.meta} icon={item.icon} color={item.color}>{item.visual}</Card>}));

