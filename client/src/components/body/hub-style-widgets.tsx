import { Activity } from "lucide-react";
import { TbActivityHeartbeat, TbBed, TbBolt, TbBrain, TbCircleCheck, TbDroplet, TbFlame, TbHeartbeat, TbLungs, TbRun, TbScale, TbWalk } from "react-icons/tb";
import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  bodyWidgetDesignRegistry,
  type BodyWidgetPlacement,
} from "./body-widget-design-registry";
import { defineWidget, type WidgetSize } from "./module-grid";

type Theme={accent:string;accent75:string;accent50:string;accentSoft:string};
const blue:Theme={accent:"#2563eb",accent75:"#5f8de8",accent50:"#93b4f6",accentSoft:"#e6eeff"};
function colorTheme(accent:string):Theme{return {accent,accent75:`color-mix(in oklch, ${accent} 72%, white)`,accent50:`color-mix(in oklch, ${accent} 48%, white)`,accentSoft:`color-mix(in oklch, ${accent} 11%, white)`}}
const score=74;
const signals=[{label:"Sleep",value:82},{label:"Strain",value:63},{label:"HRV",value:71}];
const ChartScenarioContext=createContext(50);
export function ChartDataProvider({children,showControls=true}:{children:ReactNode;showControls?:boolean}){
  const [scenario,setScenario]=useState(50);
  return <ChartScenarioContext.Provider value={scenario}>
    {children}
    {showControls?<section className="mt-6 rounded-[22px] border border-[#e4e7eb] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(24,32,42,.04)]" style={{fontFamily:inter}}>
      <div className="mb-3 flex items-baseline justify-between"><div><h2 className="text-[14px] font-semibold text-[#18202a]">Live chart data</h2><p className="text-[11px] text-[#747d89]">Verander de fictieve metingen van alle lijngrafieken.</p></div><output className="text-[14px] font-semibold tabular-nums text-[#18202a]">{scenario}</output></div>
      <input aria-label="Fictieve chartdata" className="h-2 w-full cursor-pointer accent-[#2563eb]" type="range" min="0" max="100" value={scenario} onChange={event=>setScenario(Number(event.target.value))}/>
    </section>:null}
  </ChartScenarioContext.Provider>;
}

function Icon({theme=blue}:{theme?:Theme}){return <TbActivityHeartbeat className="h-6 w-6 shrink-0" style={{color:theme.accent}}/>}
type TitleStyle={size:number;weight:number;tracking:string};
const defaultTitle:TitleStyle={size:15,weight:600,tracking:"-0.015em"};
function Title({style=defaultTitle,secondarySize=10,title="Recovery",meta="Updated today at 08:42"}:{style?:TitleStyle;secondarySize?:number;title?:string;meta?:string}){return <div><h3 className="leading-none" style={{fontSize:style.size,fontWeight:style.weight,letterSpacing:style.tracking}}>{title}</h3><p className="text-[#747d89]" style={{marginTop:4,fontSize:secondarySize,lineHeight:1.2}}>{meta}</p></div>}
function Score({solid=false,unitSize=10}:{solid?:boolean;unitSize?:number}){return <div className="flex items-baseline text-[#18202a]"><span className="text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">{score}</span><span className={`ml-1 font-medium leading-none ${solid?"text-[#18202a]":"text-[#747d89]"}`} style={{fontSize:unitSize}}>%</span></div>}
function Lines({theme=blue,radius=999,height=16,inset=0,border=false,trackStrength=10,labelSize=11,valueSize=12,showZone=false}:{theme?:Theme;radius?:number;height?:number;inset?:number;border?:boolean;trackStrength?:number;labelSize?:number;valueSize?:number;showZone?:boolean}){const tones=[theme.accent,theme.accent50,theme.accent75];return <div className={`relative my-auto space-y-4 ${showZone?"rounded-lg outline outline-1 outline-dashed outline-fuchsia-400":""}`}>{signals.map((signal,index)=><div key={signal.label}><div className="mb-2 flex items-baseline justify-between"><p className="font-medium leading-none" style={{fontSize:labelSize}}>{signal.label}</p><p className="font-semibold leading-none tabular-nums" style={{fontSize:valueSize}}>{signal.value}</p></div><div className="overflow-hidden" style={{height,padding:inset,backgroundColor:`color-mix(in srgb, ${theme.accent} ${trackStrength}%, white)`,borderRadius:radius,border:border?`1px solid color-mix(in srgb, ${theme.accent} 24%, white)`:"none",boxShadow:border?`inset 0 1px 2px color-mix(in srgb, ${theme.accent} 10%, transparent)`:"none"}}><div className="h-full" style={{width:`${signal.value}%`,backgroundColor:tones[index],borderRadius:Math.max(1,radius-inset)}} /></div></div>)}{showZone?<span className="pointer-events-none absolute right-1 top-1 rounded bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">free center zone</span>:null}</div>}
function Range({indicator=true,theme=blue}:{indicator?:boolean;theme?:Theme}){return <span className="flex items-center gap-1.5">{indicator?<TbCircleCheck aria-label="Within normal range" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} style={{color:theme.accent}}/>:null}<span>Inside your normal range</span></span>}
function Trend({theme=blue}:{theme?:Theme}){return <b className="whitespace-nowrap font-semibold" style={{color:theme.accent}}>+4%</b>}
function Candidate({placement,theme=blue,barRadius=999,barHeight=16,barInset=0,barBorder=false,trackStrength=10,titleStyle=defaultTitle,fontFamily,secondarySize=10,detailSize,showZones=false}:{placement:BodyWidgetPlacement;theme?:Theme;barRadius?:number;barHeight?:number;barInset?:number;barBorder?:boolean;trackStrength?:number;titleStyle?:TitleStyle;fontFamily?:string;secondarySize?:number;detailSize?:number;showZones?:boolean}){
  const topRight=placement==="f"||placement==="l";
  const centeredRange=placement==="l";
  const bottomRight=placement==="i";
  const scoreIcon=placement==="j";
  const centeredTop=placement==="e";
  const centeredBottom=placement==="d";
  const loweredBottom=placement==="h";
  return <article className="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-[#e4e7eb] bg-white p-5 text-[#18202a] shadow-[0_8px_22px_rgba(24,32,42,.055)]" style={{fontFamily}}>
    {centeredTop?
      <header className="dojo-widget-header grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <div className="justify-self-start"><Title style={titleStyle} secondarySize={secondarySize}/></div>
        <Icon theme={theme}/>
        <div className="justify-self-end"><Score unitSize={secondarySize}/></div>
      </header>:
      <header className={`dojo-widget-header relative flex items-start justify-between ${showZones?"rounded-lg outline outline-1 outline-dashed outline-amber-400":""}`}>
        <div className="flex items-center gap-2.5">{placement==="a"?<Icon theme={theme}/>:null}<Title style={titleStyle} secondarySize={secondarySize}/></div>
        {topRight?<Icon theme={theme}/>:scoreIcon?<div className="flex items-center gap-2"><Icon theme={theme}/><Score unitSize={secondarySize}/></div>:<Score unitSize={secondarySize}/>}
        {showZones?<span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">top zone</span>:null}
      </header>}
    <Lines theme={theme} radius={barRadius} height={barHeight} inset={barInset} border={barBorder} trackStrength={trackStrength} labelSize={detailSize??11} valueSize={detailSize??12} showZone={showZones}/>
    {centeredBottom?
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-1 text-[#747d89]" style={{fontSize:secondarySize,lineHeight:1.45}}>
        <div className="justify-self-start"><Range theme={theme}/></div>
        <Icon theme={theme}/>
        <div className="justify-self-end"><Trend theme={theme}/></div>
      </div>:
      <div style={{fontSize:secondarySize,lineHeight:1.45}} className={`relative flex justify-between pt-1 text-[#747d89] ${topRight&&!centeredRange?"items-end":"items-center"} ${loweredBottom?"pb-4":""} ${showZones?"rounded-lg outline outline-1 outline-dashed outline-cyan-400":""}`}>
        <div className="flex items-center gap-2">{placement==="c"?<Icon theme={theme}/>:placement==="k"?<><Icon theme={theme}/><Range indicator={false} theme={theme}/></>:<Range theme={theme}/>}</div>
        {topRight?<div className="-mb-0.5 text-right"><Score solid unitSize={secondarySize}/></div>:bottomRight?<Icon theme={theme}/>:<Trend theme={theme}/>}
        {showZones?<span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-700">free bottom zone</span>:null}
      </div>}
    {loweredBottom?<span className="absolute bottom-1.5 left-1/2 -translate-x-1/2"><Icon theme={theme}/></span>:null}
  </article>
}

const finalBlue=colorTheme("oklch(58% 0.22 260)");
const inter='Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
function ScaledCard({children}:{children:ReactNode}){
  const cardRef=useRef<HTMLDivElement>(null);
  const [cardSize,setCardSize]=useState({width:288,height:288});
  useLayoutEffect(()=>{
    const card=cardRef.current;
    if(!card)return;
    const measure=()=>setCardSize({width:card.clientWidth,height:card.clientHeight});
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(card);
    return ()=>observer.disconnect();
  },[]);
  const scale=cardSize.height/288;
  return <div ref={cardRef} className="h-full w-full overflow-hidden">
    <div style={{width:cardSize.width/scale,height:288,zoom:scale}}>{children}</div>
  </div>
}
const showZoneGuides=false;
const slotClass=`min-h-0 min-w-0 overflow-visible rounded-md border [container-type:size] ${showZoneGuides?"border-dashed border-[var(--widget-border)]":"border-transparent"}`;
const examples=[
  {title:"Recovery",meta:"Updated today at 08:42",icon:TbActivityHeartbeat,theme:colorTheme("oklch(58% 0.22 260)")},
  {title:"Sleep",meta:"Last night",icon:TbBed,theme:colorTheme("oklch(58% 0.19 292)")},
  {title:"Steps",meta:"Today",icon:TbWalk,theme:colorTheme("oklch(62% 0.18 148)")},
  {title:"Heart rate",meta:"Live · just now",icon:TbHeartbeat,theme:colorTheme("oklch(60% 0.22 25)")},
  {title:"Stress",meta:"Today · 8 readings",icon:TbBrain,theme:colorTheme("oklch(70% 0.17 78)")},
  {title:"Hydration",meta:"Today",icon:TbDroplet,theme:colorTheme("oklch(62% 0.16 220)")},
  {title:"Energy",meta:"Updated 12 min ago",icon:TbBolt,theme:colorTheme("oklch(68% 0.19 52)")},
  {title:"Respiration",meta:"Last 24 hours",icon:TbLungs,theme:colorTheme("oklch(62% 0.14 182)")},
  {title:"Weight",meta:"30-day trend",icon:TbScale,theme:colorTheme("oklch(60% 0.18 320)")},
  {title:"Training load",meta:"This week",icon:TbRun,theme:colorTheme("oklch(63% 0.21 35)")},
] as const;
const exampleAccentHex=["#2563eb","#805adf","#20a65a","#ef3340","#e09300","#00a4c7","#f97316","#00a893","#c346b7","#f04417"] as const;
function MetricBlock({label,value,unit}:{label:string;value:string;unit?:string}){return <div className="flex h-full min-h-0 min-w-0 flex-col justify-end overflow-visible"><span className="text-[11px] leading-none text-[#747d89]">{label}</span><strong className="mt-1 text-[16px] leading-none tracking-[-.03em] tabular-nums">{value}<small className="ml-0.5 text-[10px] font-medium">{unit}</small></strong></div>}
function MiniBars({values,labels,displayValues,unit="",interactive=false}:{values:number[];labels?:string[];displayValues?:Array<string|number>;unit?:string;interactive?:boolean}){
  return <div className="flex h-full items-end gap-1.5">{values.map((value,index)=>interactive?<button
    key={index}
    type="button"
    aria-label={`${labels?.[index]??`Reading ${index+1}`}: ${displayValues?.[index]??value}${unit}`}
    className="dojo-widget-action group relative min-w-0 flex-1 cursor-crosshair self-end rounded-t-[3px] bg-[var(--widget-accent)] p-0 opacity-70 outline-none transition-[opacity,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:z-10 hover:scale-y-[1.025] hover:opacity-100 focus:z-10 focus:scale-y-[1.025] focus:opacity-100 motion-reduce:transition-none"
    style={{height:`${value}%`}}
  >
    <span role="tooltip" className={`pointer-events-none absolute bottom-full mb-2 hidden w-max max-w-[92px] rounded-md border border-[#e4e7eb] bg-white px-2 py-1.5 text-left normal-case shadow-[0_6px_16px_rgba(24,32,42,.12)] group-hover:block group-focus:block ${index<2?"left-0":index>values.length-3?"right-0":"left-1/2 -translate-x-1/2"}`}>
      <span className="block text-[9px] font-medium leading-none text-[#747d89]">{labels?.[index]??`Reading ${index+1}`}</span>
      <strong className="mt-1 block whitespace-nowrap text-[12px] font-semibold leading-none text-[#18202a]">{displayValues?.[index]??value}<small className="ml-0.5 text-[9px] font-medium text-[#747d89]">{unit}</small></strong>
    </span>
  </button>:<i key={index} className="min-w-0 flex-1 rounded-t-[3px]" style={{height:`${value}%`,backgroundColor:"var(--widget-accent)",opacity:.72}}/>)}</div>;
}

function LocalHint({children,text,align="center"}:{children:ReactNode;text:string;align?:"left"|"center"|"right"}){
  const position=align==="left"?"left-0":align==="right"?"right-0":"left-1/2 -translate-x-1/2";
  return <span className="dojo-widget-action group relative inline-flex cursor-help outline-none" tabIndex={0} aria-label={text}>
    {children}
    <span role="tooltip" className={`pointer-events-none absolute bottom-full z-40 mb-1.5 hidden w-max whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block ${position}`}>{text}</span>
  </span>;
}
function scenarioValues(values:number[],domain:[number,number],scenario:number){
  return values.map((base,index)=>{
    const influence=(scenario-50)/50;
    const wave=Math.sin(index*1.37+scenario*.07)*influence*(domain[1]-domain[0])*.13;
    const drift=influence*(index/(values.length-1)-.5)*(domain[1]-domain[0])*.16;
    return Math.max(domain[0],Math.min(domain[1],base+wave+drift));
  });
}
function formatScaleValue(value:number){
  return Number.isInteger(value)?String(value):value.toFixed(1);
}
function ChartTooltip({active,payload,labels,unit}:{active?:boolean;payload?:Array<{value?:number;payload?:{index?:number}}>;labels?:string[];unit:string}){
  if(!active||!payload?.length)return null;
  const point=payload[0];
  const index=point.payload?.index??0;
  return <div className="pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-0.5 duration-150 motion-reduce:animate-none rounded-md border border-[#e4e7eb] bg-white px-2 py-1.5 shadow-[0_6px_16px_rgba(24,32,42,.12)]">
    <p className="text-[9px] leading-none text-[#747d89]">{labels?.[index]??`Reading ${index+1}`}</p>
    <p className="mt-1 text-[12px] font-semibold leading-none tabular-nums text-[#18202a]">{unit==="bpm"?Math.round(point.value??0):(point.value??0).toFixed(1)} <span className="text-[9px] font-medium text-[#747d89]">{unit}</span></p>
  </div>;
}
function Sparkline({values,domain=[0,100],strokeWidth=3,smooth=true,showScale=false,scaleCount=3,interactive=false,tooltipLabels,tooltipUnit="value"}:{values:number[];domain?:[number,number];strokeWidth?:number;smooth?:boolean;showScale?:boolean;scaleCount?:2|3;interactive?:boolean;tooltipLabels?:string[];tooltipUnit?:string}){
  const scenario=useContext(ChartScenarioContext);
  const liveValues=useMemo(()=>scenarioValues(values,domain,scenario),[domain,scenario,values]);
  const liveMin=Math.min(...liveValues);
  const liveMax=Math.max(...liveValues);
  const liveDomain:[number,number]=liveMin===liveMax?[liveMin-1,liveMax+1]:[liveMin,liveMax];
  const ticks=scaleCount===2?[liveDomain[0],liveDomain[1]]:[liveDomain[0],(liveDomain[0]+liveDomain[1])/2,liveDomain[1]];
  const data=liveValues.map((value,index)=>({index,value}));
  return <div className={`grid h-full w-full min-h-0 overflow-visible ${showScale?"grid-cols-[minmax(0,1fr)_22px]":"grid-cols-1"} ${interactive?"cursor-crosshair":""}`}>
    <div className="h-full min-h-0 min-w-0 overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{top:2,right:0,bottom:2,left:0}} style={{overflow:"visible"}}>
          <CartesianGrid vertical={false} stroke="#D9DEE5" strokeWidth={0.8} strokeLinecap="butt"/>
          <XAxis hide dataKey="index" type="number" domain={[0,data.length-1]} allowDataOverflow/>
          <YAxis hide width={0} domain={liveDomain} ticks={ticks}/>
          {interactive?<Tooltip cursor={{stroke:"#747D89",strokeWidth:0.8,strokeDasharray:"2 2"}} content={<ChartTooltip labels={tooltipLabels} unit={tooltipUnit}/>} isAnimationActive={false} wrapperStyle={{outline:"none",pointerEvents:"none"}}/>:null}
          <Line dataKey="value" type={smooth?"monotone":"linear"} stroke="var(--widget-accent)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" dot={false} activeDot={interactive?{r:3.5,fill:"#FFFFFF",stroke:"var(--widget-accent)",strokeWidth:2}:false} isAnimationActive={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
    {showScale?<div className="pointer-events-none relative h-full min-h-0 text-[9px] leading-none tabular-nums text-[#87909c]">
      <span className="absolute right-0 top-[2px] -translate-y-1/2 text-right">{formatScaleValue(liveMax)}</span>
      {scaleCount===3?<span className="absolute right-0 top-1/2 -translate-y-1/2 text-right">{formatScaleValue(ticks[1])}</span>:null}
      <span className="absolute bottom-[2px] right-0 translate-y-1/2 text-right">{formatScaleValue(liveMin)}</span>
    </div>:null}
  </div>;
}
function RingVisual({value,label,contentScale=1,interactive=false}:{value:number;label:string;contentScale?:number;interactive?:boolean}){
  const circumference=2*Math.PI*45;
  const ring=<div className={`group relative h-full w-full outline-none ${interactive?"dojo-widget-action cursor-default":""}`} tabIndex={interactive?0:undefined}>
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-soft)" strokeWidth="8" className={interactive?"transition-opacity duration-150 group-hover:opacity-65 group-focus-visible:opacity-65 motion-reduce:transition-none":undefined}/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-value/100)} className={interactive?"transition-[stroke-width,filter] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:[filter:saturate(1.08)] group-hover:[stroke-width:9] group-focus-visible:[filter:saturate(1.08)] group-focus-visible:[stroke-width:9] motion-reduce:transition-none":undefined}/>
    </svg>
    <div className={`absolute inset-0 flex flex-col items-center justify-center ${interactive?"transition-transform duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none":""}`}><strong className="leading-none tracking-[-.05em] text-[#18202a]" style={{fontSize:30*contentScale}}>{value}</strong><span className="text-[#747d89]" style={{fontSize:11*contentScale}}>{label}</span></div>
  </div>;
  return ring;
}
function WaveSegment({label,value,points}:{label:string;value:string;points:number[]}){
  const scenario=useContext(ChartScenarioContext);
  const liveValue=scenarioValues(points,[10,18],scenario).at(-1)??Number(value);
  const timeLabels:Record<string,string[]>={Night:["00:00","01:00","02:00","03:00","04:00","05:00"],Morning:["06:00","07:00","08:00","09:00","10:00","11:00"],Afternoon:["12:00","13:00","14:00","15:00","16:00","17:00"],Evening:["18:00","19:00","20:00","21:00","22:00","23:00"]};
  return <div className={`grid h-full min-h-0 grid-rows-[11px_minmax(0,1fr)_14px] gap-1 ${slotClass}`}>
    <span className="text-[11px] leading-none text-[#747d89]">{label}</span>
    <Sparkline values={points} domain={[10,18]} strokeWidth={2} showScale scaleCount={2} interactive tooltipUnit="br/min" tooltipLabels={timeLabels[label]}/>
    <strong className="text-[14px] leading-none text-[#18202a]">{liveValue.toFixed(1)}</strong>
  </div>;
}
function CenterSubdivision({variant}:{variant:number}){
  const scenario=useContext(ChartScenarioContext);
  const heartValues=[58,63,61,70,67,78,64,69,66,72];
  const liveHeart=Math.round(scenarioValues(heartValues,[50,85],scenario).at(-1)??72);
  const weightValues=[80.1,79.8,79.6,79.4,79.1,78.8,78.9,78.6,78.5,78.4];
  const liveWeight=scenarioValues(weightValues,[77.5,81],scenario);
  const currentWeight=liveWeight.at(-1)??78.4;
  const weightChange=currentWeight-(liveWeight[0]??80.1);
  if(variant===0)return <div className={`h-full w-full ${slotClass}`}><RingVisual value={74} label="recovery" interactive/></div>;
  if(variant===1)return <div className="grid h-full min-h-0 grid-cols-2 gap-3 overflow-visible">
    <div className={slotClass}><RingVisual value={86} label="sleep score" contentScale={0.776} interactive/></div>
    <div className={`${slotClass} flex flex-col justify-center`}>
      <strong className="text-center text-[25px] leading-none text-[#18202a]">7:48</strong>
      <span className="mt-1 text-center text-[11px] text-[#747d89]">time asleep</span>
      <div className="mt-4 flex items-center">
        <i className="h-2.5 w-2.5 rounded-full bg-[var(--widget-accent)]"/>
        <i className="h-0.5 flex-1 bg-[var(--widget-accent)]"/>
        <i className="h-2.5 w-2.5 rounded-full bg-[var(--widget-accent)]"/>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[#747d89]"><span>23:12</span><span>07:00</span></div>
    </div>
  </div>;
  if(variant===2)return <div className="grid h-full grid-cols-[2fr_1fr] gap-3"><div className={slotClass}><MiniBars interactive values={[22,38,51,67,84,72,56,33,19]} labels={["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"]} displayValues={[380,690,920,1260,1510,1320,1050,740,556]} unit=" steps"/></div><div className={slotClass}><MetricBlock label="Today" value="8,426"/></div></div>;
  if(variant===3)return <div className="grid h-full grid-cols-[1fr_2fr] gap-3"><div className={slotClass}><MetricBlock label="Current" value={String(liveHeart)} unit="bpm"/></div><div className={slotClass}><Sparkline values={heartValues} domain={[50,85]} strokeWidth={3} showScale interactive tooltipUnit="bpm" tooltipLabels={["08:06","08:12","08:18","08:24","08:30","08:36","08:42","08:48","08:54","Now"]}/></div></div>;
  if(variant===4)return <div className="grid h-full grid-cols-3 gap-3">
    {[["Low",18,.55,"09:12"],["Average",31,.72,"Today"],["Peak",64,1,"14:38"]].map(([label,value,opacity,hint],index)=><div key={String(label)} className={`dojo-widget-action group relative cursor-crosshair outline-none ${slotClass}`} tabIndex={0} aria-label={`${label} stress ${value}, ${hint}`}><span className="absolute left-0 top-0 text-[11px] text-[#747d89]">{label}</span><span role="tooltip" className={`pointer-events-none absolute top-5 z-20 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block ${index===2?"right-0":"left-0"}`}>{hint}</span><div className="absolute inset-x-0 bottom-0 top-5"><i className="absolute inset-x-0 bottom-0 rounded-t-md bg-[var(--widget-accent)] transition-[opacity,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-y-[1.02] group-hover:opacity-100 group-focus-visible:scale-y-[1.02] group-focus-visible:opacity-100 motion-reduce:transition-none" style={{height:`${value}%`,opacity:Number(opacity)}}/><strong className="absolute bottom-0 left-0 text-[15px] leading-none" style={{color:Number(opacity)>.85?"var(--widget-soft)":"var(--widget-ink)"}}>{value}</strong></div></div>)}
  </div>;
  if(variant===5)return <div className="grid h-full min-h-0 grid-cols-[2fr_1fr] gap-3 overflow-visible"><div className={`dojo-widget-action group relative cursor-crosshair outline-none ${slotClass}`} tabIndex={0} aria-label="68% of hydration goal"><div className="absolute inset-0 overflow-hidden rounded-md bg-[var(--widget-soft)]"><div className="absolute inset-x-0 bottom-0 h-[68%] rounded-t-md bg-[var(--widget-accent)] transition-opacity duration-150 group-hover:opacity-90 group-focus-visible:opacity-90 motion-reduce:transition-none"/></div><span role="tooltip" className="pointer-events-none absolute left-1/2 top-2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block">68% of goal</span><span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white">1.7 L</span></div><span className="grid min-h-0 grid-rows-2 gap-3 overflow-visible"><div className={slotClass}><MetricBlock label="Goal" value="2.5" unit="L"/></div><div className={slotClass}><MetricBlock label="Left" value="0.8" unit="L"/></div></span></div>;
  if(variant===6)return <div className="grid h-full grid-rows-2 gap-3"><div className={slotClass}><div className="flex h-full items-center justify-between"><span className="text-[11px] text-[#747d89]">Body battery</span><strong className="text-[24px]">68</strong></div></div><div className={slotClass}><MiniBars interactive values={[31,42,55,71,82,74,68]} labels={["06:00","09:00","12:00","15:00","18:00","21:00","Now"]} unit=""/></div></div>;
  if(variant===7)return <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-3 overflow-visible">
    <WaveSegment label="Night" value="12.8" points={[12.2,13.1,12.6,13.4,12.9,12.8]}/>
    <WaveSegment label="Morning" value="14.6" points={[13.1,14.8,13.7,15.2,14.2,14.6]}/>
    <WaveSegment label="Afternoon" value="15.1" points={[14.4,14.0,15.3,14.7,16.1,15.1]}/>
    <WaveSegment label="Evening" value="13.9" points={[15.0,14.2,14.6,13.5,14.1,13.9]}/>
  </div>;
  if(variant===8)return <div className="grid h-full min-h-0 grid-rows-[2fr_1fr] gap-3 overflow-visible"><div className={slotClass}><Sparkline values={weightValues} domain={[77.5,81]} strokeWidth={3} showScale interactive tooltipUnit="kg" tooltipLabels={["Day 1","Day 4","Day 7","Day 10","Day 13","Day 16","Day 19","Day 22","Day 26","Today"]}/></div><span className="grid min-h-0 grid-cols-3 gap-3 overflow-visible">
    <div className={`flex items-end justify-start ${slotClass}`}><div className="flex flex-col items-start"><span className="text-[11px] leading-none text-[#747d89]">Now</span><strong className="mt-1 text-[16px] leading-none text-[#18202a]">{currentWeight.toFixed(1)}</strong></div></div>
    <div className={`flex items-end justify-center ${slotClass}`}><div className="flex flex-col items-center text-center"><span className="text-[11px] leading-none text-[#747d89]">Start</span><strong className="mt-1 text-[16px] leading-none text-[#18202a]">{(liveWeight[0]??80.1).toFixed(1)}</strong></div></div>
    <div className={`flex items-end justify-end ${slotClass}`}><div className="flex flex-col items-end text-right"><span className="text-[11px] leading-none text-[#747d89]">Change</span><strong className="mt-1 text-[16px] leading-none text-[#18202a]">{weightChange>0?"+":""}{weightChange.toFixed(1)}</strong></div></div>
  </span></div>;
  return <div className="grid h-full grid-cols-[1fr_.65fr_1fr] gap-3">
    <div className={`dojo-widget-action group relative cursor-default outline-none ${slotClass}`} tabIndex={0} aria-label="Cardio load 312 this week"><span className="absolute left-0 top-0 text-[11px] text-[#747d89]">Cardio</span><div className="absolute inset-x-0 bottom-0 top-5"><i className="absolute inset-x-0 bottom-0 rounded-t-md bg-[var(--widget-accent)] transition-[filter,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-y-[1.02] group-hover:[filter:saturate(1.08)] group-focus-visible:scale-y-[1.02] group-focus-visible:[filter:saturate(1.08)] motion-reduce:transition-none" style={{height:"78%"}}/><strong className="absolute bottom-0 left-0 text-[16px] leading-none text-[var(--widget-soft)]">312</strong></div></div>
    <div className={`${slotClass} flex flex-col items-center justify-center`}><LocalHint text="Balanced split"><span className="flex flex-col items-center"><TbFlame className="h-7 w-7 text-[var(--widget-accent)]"/><span className="mt-1 text-[11px] text-[#747d89]">balanced</span></span></LocalHint></div>
    <div className={`dojo-widget-action group relative cursor-default outline-none ${slotClass}`} tabIndex={0} aria-label="Strength load 184 this week"><span className="absolute left-0 top-0 text-[11px] text-[#747d89]">Strength</span><div className="absolute inset-x-0 bottom-0 top-5"><i className="absolute inset-x-0 bottom-0 rounded-t-md bg-[var(--widget-accent)] opacity-50 transition-[opacity,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-y-[1.02] group-hover:opacity-65 group-focus-visible:scale-y-[1.02] group-focus-visible:opacity-65 motion-reduce:transition-none" style={{height:"46%"}}/><strong className="absolute bottom-0 left-0 text-[16px] leading-none text-[var(--widget-ink)]">184</strong></div></div>
  </div>;
}
function BottomSubdivision({variant}:{variant:number}){
  if(variant===0)return <div className={`flex h-full w-full items-end justify-between ${slotClass}`}><span className="text-[11px] text-[#747d89]">Inside your normal range</span><LocalHint text="vs 7-day avg" align="right"><b className="text-[14px] leading-none text-[#18202a]">+4%</b></LocalHint></div>;
  if(variant===1)return <div className="grid h-full min-h-0 w-full grid-cols-2 gap-2 overflow-visible">
    <div className={`flex items-end justify-center ${slotClass}`}><div className="flex items-baseline gap-1.5"><span className="text-[14px] font-semibold leading-none text-[#18202a]">Deep</span><strong className="text-[14px] leading-none text-[#18202a]">1:42</strong></div></div>
    <div className={`flex items-end justify-center ${slotClass}`}><div className="flex items-baseline gap-1.5"><span className="text-[14px] font-semibold leading-none text-[#18202a]">REM</span><strong className="text-[14px] leading-none text-[#18202a]">1:56</strong></div></div>
  </div>;
  if(variant===2)return <div className="grid h-full min-h-0 w-full grid-cols-[1fr_2fr] gap-2 overflow-visible">
    <div className={`flex items-end ${slotClass}`}><div className="flex items-baseline gap-1"><strong className="text-[14px] leading-none text-[#18202a]">6.2</strong><span className="text-[11px] leading-none text-[#18202a]">km</span></div></div>
    <div className={`flex min-w-0 items-end justify-end ${slotClass}`}><div className="flex items-baseline gap-1"><strong className="text-[14px] leading-none text-[#18202a]">420</strong><span className="text-[11px] leading-none text-[#18202a]">kcal</span></div></div>
  </div>;
  if(variant===3)return <div className="grid h-full min-h-0 w-full grid-cols-3 gap-2 overflow-visible">
    {[["Resting","58","During sleep"],["Average","71","Today"],["High","132","Today"]].map(([label,value,hint],index)=><div key={label} className={`flex items-end ${slotClass}`}><LocalHint text={hint} align={index===0?"left":index===2?"right":"center"}><span className="flex min-w-0 items-baseline gap-1"><span className="truncate text-[10px] leading-none text-[#747d89]">{label}</span><strong className="text-[14px] leading-none text-[#18202a]">{value}</strong></span></LocalHint></div>)}
  </div>;
  if(variant===4)return <div className={`mx-auto flex h-full w-[45%] items-end justify-center ${slotClass}`}><LocalHint text="Usual range"><span className="flex items-center gap-1.5"><TbCircleCheck className="h-4 w-4 text-[var(--widget-accent)]"/><span className="text-[13px] font-medium leading-none text-[#18202a]">Balanced</span></span></LocalHint></div>;
  if(variant===5)return <div className="grid h-full min-h-0 w-full grid-cols-[3fr_1fr] gap-2 overflow-visible">
    <div className={`flex min-w-0 items-end justify-start ${slotClass}`}><div className="flex items-baseline gap-1"><strong className="text-[14px] leading-none text-[#18202a]">5 / 8</strong><span className="text-[11px] leading-none text-[#18202a]">glasses</span></div></div>
    <div className={`flex items-end justify-end ${slotClass}`}><LocalHint text="On pace" align="right"><TbCircleCheck aria-label="Hydration is on pace" className="h-4 w-4 text-[var(--widget-accent)]"/></LocalHint></div>
  </div>;
  if(variant===6)return <div className="grid h-full min-h-0 w-full grid-cols-4 gap-2 overflow-visible">
    {[["AM","82"],["Noon","68"],["PM","51"],["Now","42"]].map(([label,value])=><div key={label} className={`flex flex-col items-center justify-end ${slotClass}`}><span className="text-[8px] leading-none text-[#747d89]">{label}</span><strong className="text-[13px] leading-none text-[#18202a]">{value}</strong></div>)}
  </div>;
  if(variant===7)return <div className={`flex h-full w-[40%] items-end justify-start ${slotClass}`}><LocalHint text="Within usual range" align="left"><span className="flex items-center gap-1"><TbCircleCheck className="h-4 w-4 shrink-0 text-[var(--widget-accent)]"/><span className="text-[12px] font-medium text-[#18202a]">Stable</span></span></LocalHint></div>;
  if(variant===8)return <div className={`ml-auto flex h-full w-1/3 items-end justify-end ${slotClass}`}><div className="flex items-baseline gap-1 text-right"><span className="text-[11px] leading-none text-[#18202a]">Goal</span><b className="text-[15px] leading-none text-[#18202a]">75 kg</b></div></div>;
  return <div className="grid h-full w-full grid-cols-5 gap-2">{[["M","Mon 20"],["T","Tue 21"],["W","Wed 22"],["T","Thu 23"],["F","Fri 24"]].map(([day,date],index)=><div key={date} className={`dojo-widget-action group relative flex cursor-help items-center justify-center text-[12px] font-semibold outline-none ${slotClass}`} tabIndex={0} aria-label={date} style={index<3?{backgroundColor:"var(--widget-soft)",color:"var(--widget-accent)"}:{color:"#18202a"}}><span role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block ${index===0?"left-0":index===4?"right-0":"left-1/2 -translate-x-1/2"}`}>{date}</span>{day}</div>)}</div>;
}

type StepsVariantId="hourly-bars"|"goal-ring"|"step-field";
const stepValues=[22,38,51,67,84,72,56,33,19];
const stepLabels=["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"];

function StepsStats({includeRemaining=false}:{includeRemaining?:boolean}){
  return <div className={`grid h-full min-h-0 ${includeRemaining?"grid-cols-3":"grid-cols-2"} gap-3 overflow-visible`}>
    <div className={`flex items-end ${slotClass}`}><div className="flex items-baseline gap-1"><strong className="text-[14px] leading-none">6.2</strong><span className="text-[11px] leading-none">km</span></div></div>
    <div className={`flex items-end ${includeRemaining?"justify-center":"justify-end"} ${slotClass}`}><div className="flex items-baseline gap-1"><strong className="text-[14px] leading-none">420</strong><span className="text-[11px] leading-none">kcal</span></div></div>
    {includeRemaining?<div className={`flex items-end justify-end ${slotClass}`}><div className="text-right"><span className="block text-[10px] leading-none text-[#747d89]">Remaining</span><strong className="mt-1 block text-[14px] leading-none">1,574</strong></div></div>:null}
  </div>;
}

function StepsHeader(){
  return <header className={`dojo-widget-header flex min-h-0 items-start justify-between ${slotClass}`}>
    <Title title="Steps" meta="Today" secondarySize={11}/>
    <TbWalk className="h-6 w-6 shrink-0 text-[var(--widget-accent)]"/>
  </header>;
}

function StepsBarsVariant({size}:{size:WidgetSize}){
  const wide=size.w>size.h;
  const roomy=size.w>1||size.h>1;
  return <div className="grid h-full min-h-0 grid-rows-[33px_minmax(0,1fr)_33px] gap-[15px]">
    <StepsHeader/>
    <div className={`grid min-h-0 gap-3 overflow-visible ${wide?"grid-cols-[minmax(0,2fr)_minmax(112px,.8fr)]":"grid-cols-[minmax(0,2fr)_minmax(72px,1fr)]"}`}>
      <div className={slotClass}><MiniBars interactive values={stepValues} labels={stepLabels} displayValues={[380,690,920,1260,1510,1320,1050,740,556]} unit=" steps"/></div>
      <div className={`${slotClass} flex flex-col justify-end`}>
        <span className="text-[10px] leading-none text-[#747d89]">Today</span>
        <strong className="mt-1 text-[22px] leading-none tracking-[-.04em]">8,426</strong>
        {roomy?<div className="mt-3"><div className="mb-1 flex justify-between text-[9px] text-[#747d89]"><span>Goal</span><span>84%</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--widget-soft)]"><div className="h-full w-[84%] rounded-full bg-[var(--widget-accent)]"/></div></div>:null}
      </div>
    </div>
    <StepsStats includeRemaining={roomy}/>
  </div>;
}

function StepsRingGraphic(){
  const circumference=2*Math.PI*45;
  return <button type="button" className="dojo-widget-action group relative block h-full min-h-0 w-full cursor-help border-0 bg-transparent p-0 text-inherit outline-none" aria-label="84% of daily step goal">
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-soft)" strokeWidth="8" className="transition-opacity duration-150 group-hover:opacity-65 group-focus:opacity-65 motion-reduce:transition-none"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*.1574} className="transition-[stroke-width,filter] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:[filter:saturate(1.08)] group-hover:[stroke-width:9] group-focus:[filter:saturate(1.08)] group-focus:[stroke-width:9] motion-reduce:transition-none"/>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-1 group-focus:-translate-y-1 motion-reduce:transition-none"><strong className="text-[25px] leading-none tracking-[-.045em]">8,426</strong><span className="mt-1 text-[10px] leading-none text-[#747d89]">of 10,000</span></div>
    <span role="tooltip" className="pointer-events-none absolute left-1/2 top-[61%] z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block">84% of goal</span>
  </button>;
}

function StepsRingVariant({size}:{size:WidgetSize}){
  const roomy=size.w>1||size.h>1;
  const tall=size.h>size.w;
  const squareLarge=size.w>1&&size.h>1;
  return <div className={`grid h-full min-h-0 gap-[15px] ${squareLarge?"grid-rows-[33px_minmax(0,1fr)_72px]":"grid-rows-[33px_minmax(0,1fr)_33px]"}`}>
    <StepsHeader/>
    <div className={`grid min-h-0 gap-3 overflow-visible ${tall?"grid-rows-[minmax(0,1.25fr)_minmax(92px,.75fr)]":roomy?"grid-cols-[minmax(150px,.8fr)_minmax(0,1.5fr)]":"grid-cols-1"}`}>
      <div className={slotClass}><StepsRingGraphic/></div>
      {roomy?<div className={`grid min-h-0 gap-3 ${squareLarge?"grid-rows-[minmax(0,1fr)_52px]":"grid-rows-1"}`}>
        <div className={slotClass}><MiniBars interactive values={stepValues} labels={stepLabels} displayValues={[380,690,920,1260,1510,1320,1050,740,556]} unit=" steps"/></div>
        {squareLarge?<div className={`grid grid-cols-3 gap-3 ${slotClass}`}><MetricBlock label="Peak hour" value="1,510"/><MetricBlock label="Goal" value="10k"/><MetricBlock label="Pace" value="+6%"/></div>:null}
      </div>:null}
    </div>
    <StepsStats includeRemaining={roomy}/>
  </div>;
}

function StepField(){
  return <button type="button" className="dojo-widget-action group relative grid aspect-square max-h-full w-full max-w-full cursor-help grid-cols-10 grid-rows-10 gap-[3px] border-0 bg-transparent p-0 outline-none" aria-label="84 of 100 step goal units completed">
    {Array.from({length:100},(_,index)=><i key={index} className={`rounded-[2px] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 motion-reduce:transition-none ${index<84?"opacity-[.78]":"opacity-100"}`} style={{backgroundColor:index<84?"var(--widget-accent)":"var(--widget-soft)"}}/>)}
    <span role="tooltip" className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block">84% of goal</span>
  </button>;
}

function StepsFieldVariant({size}:{size:WidgetSize}){
  const tall=size.h>size.w;
  const wide=size.w>size.h;
  return <div className={`grid h-full min-h-0 gap-[15px] ${tall?"grid-rows-[33px_minmax(0,1fr)_82px]":"grid-rows-[33px_minmax(0,1fr)_33px]"}`}>
    <StepsHeader/>
    <div className={`grid min-h-0 gap-3 overflow-visible ${wide?"grid-cols-[minmax(150px,.75fr)_minmax(0,1.5fr)]":tall?"grid-rows-[minmax(0,1fr)_82px]":"grid-cols-[minmax(0,1fr)_82px]"}`}>
      <div className={`${slotClass} flex min-h-0 items-center justify-center`}><StepField/></div>
      <div className={`${slotClass} ${wide?"grid grid-cols-[.65fr_1fr] items-center gap-6":"flex flex-col justify-end"}`}>
        <div className={wide?"self-center":undefined}><span className="text-[10px] leading-none text-[#747d89]">Today</span><strong className="mt-1 block text-[22px] leading-none tracking-[-.04em]">8,426</strong>{(tall||wide)?<><span className="mt-3 block text-[10px] text-[#747d89]">Goal progress</span><strong className="mt-1 block text-[16px] leading-none">84%</strong></>:null}</div>
        {wide?<div className="grid grid-cols-3 gap-3 self-stretch">
          {[["Morning","2,140"],["Afternoon","4,670"],["Evening","1,616"]].map(([label,value])=><div key={label} className={`flex flex-col justify-center ${slotClass}`}><span className="text-[10px] text-[#747d89]">{label}</span><strong className="mt-1 text-[15px] leading-none">{value}</strong></div>)}
        </div>:null}
      </div>
    </div>
    {tall?<div className="grid h-full grid-cols-2 gap-3"><StepsStats/><div className={`grid grid-cols-2 gap-3 ${slotClass}`}><MetricBlock label="Peak" value="14:00"/><MetricBlock label="Best hour" value="1,510"/></div></div>:<StepsStats includeRemaining={wide}/>}
  </div>;
}

function StepsWidget({variant,size,accentColor}:{variant:StepsVariantId;size:WidgetSize;accentColor?:string}){
  const cardRef=useRef<HTMLElement>(null);
  const [cardSize,setCardSize]=useState({width:288,height:288});
  useLayoutEffect(()=>{
    const card=cardRef.current;
    if(!card)return;
    const measure=()=>setCardSize({width:card.clientWidth,height:card.clientHeight});
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(card);
    return ()=>observer.disconnect();
  },[]);
  const scale=Math.max(.35,Math.min(cardSize.width/(288*size.w),cardSize.height/(288*size.h)));
  const theme=colorTheme(accentColor??"#20a65a");
  const content=variant==="goal-ring"?<StepsRingVariant size={size}/>:variant==="step-field"?<StepsFieldVariant size={size}/>:<StepsBarsVariant size={size}/>;
  return <article ref={cardRef} className="relative h-full w-full overflow-hidden rounded-[var(--body-widget-radius)] border border-[#e4e7eb] bg-white shadow-[0_8px_22px_rgba(24,32,42,.055)]">
    <div className="absolute left-0 top-0 box-border overflow-visible text-[#18202a]" style={{fontFamily:inter,width:cardSize.width/scale,height:cardSize.height/scale,transform:`scale(${scale})`,transformOrigin:"top left","--widget-accent":theme.accent,"--widget-soft":theme.accentSoft,"--widget-border":`color-mix(in srgb, ${theme.accent} 70%, transparent)`} as CSSProperties}>
      <div
        className="absolute left-5 top-5 min-h-0 min-w-0 overflow-visible"
        style={{width:"calc(100% - 40px)",height:"calc(100% - 40px)"}}
      >
        {content}
      </div>
    </div>
  </article>;
}
function ProposedZonedE({empty=false,compositionVariant,accentColor}:{empty?:boolean;compositionVariant?:number;accentColor?:string}){
  const cardRef=useRef<HTMLElement>(null);
  const [cardSize,setCardSize]=useState({width:288,height:288});

  useLayoutEffect(()=>{
    const card=cardRef.current;
    if(!card)return;
    const measure=()=>setCardSize({width:card.clientWidth,height:card.clientHeight});
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(card);
    return ()=>observer.disconnect();
  },[]);

  const scale=Math.max(.35,Math.min(cardSize.width/288,cardSize.height/288));
  const designWidth=cardSize.width/scale;
  const designHeight=cardSize.height/scale;
  const usableDesignHeight=Math.max(0,designHeight-70);
  const shown=(value:number)=>Math.round((usableDesignHeight*(value/218))*scale);
  const structural=compositionVariant!==undefined;
  const example=structural?examples[compositionVariant]:undefined;
  const ExampleIcon=example?.icon;
  const defaultTheme=example?.theme??finalBlue;
  const exampleTheme=accentColor?colorTheme(accentColor):defaultTheme;

  return <article ref={cardRef} className="relative h-full w-full overflow-hidden rounded-[var(--body-widget-radius)] border border-[#e4e7eb] bg-white shadow-[0_8px_22px_rgba(24,32,42,.055)] transition-[border-color,box-shadow] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:border-[#d7dce2] hover:shadow-[0_10px_26px_rgba(24,32,42,.09)] motion-reduce:transition-none">
    <div className="absolute left-0 top-0 box-border grid gap-[15px] overflow-visible p-5 text-[#18202a]" style={{fontFamily:inter,width:designWidth,height:designHeight,gridTemplateRows:"33fr 152fr 33fr",transform:`scale(${scale})`,transformOrigin:"top left","--widget-accent":exampleTheme.accent,"--widget-soft":exampleTheme.accentSoft,"--widget-border":`color-mix(in srgb, ${exampleTheme.accent} 70%, transparent)`,"--widget-ink":`color-mix(in oklch, ${exampleTheme.accent} 58%, black)`} as CSSProperties}>
      <header className={`dojo-widget-header relative flex min-h-0 items-start justify-between overflow-visible rounded-lg border ${showZoneGuides?"border-dashed border-amber-400":"border-transparent"}`}>
        {structural&&example&&ExampleIcon?<><Title secondarySize={11} title={example.title} meta={example.meta}/><ExampleIcon className="h-6 w-6 shrink-0" style={{color:exampleTheme.accent}}/></>:empty?null:<><Title secondarySize={11}/><Icon theme={finalBlue}/></>}
        {!showZoneGuides||structural?null:<span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">top · {shown(33)}px</span>}
      </header>
      <div className={`relative flex min-h-0 flex-col justify-center overflow-visible rounded-lg border ${showZoneGuides?"border-dashed border-fuchsia-400":"border-transparent"}`}>
        {structural?
          <CenterSubdivision variant={compositionVariant}/>:
          empty?null:<Lines theme={finalBlue} radius={7} height={15} labelSize={11} valueSize={11}/>}
        {!showZoneGuides||structural?null:<span className="pointer-events-none absolute right-1 top-1 rounded bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">center · {shown(152)}px</span>}
      </div>
      <div className={`relative flex min-h-0 items-end justify-between overflow-visible rounded-lg border text-[11px] leading-[1.45] text-[#18202a] ${showZoneGuides?"border-dashed border-cyan-400":"border-transparent"}`}>
        {structural?<BottomSubdivision variant={compositionVariant}/>:empty?null:<><Range theme={finalBlue}/><LocalHint text="Recovery score" align="right"><Score solid unitSize={11}/></LocalHint></>}
        {!showZoneGuides||structural?null:<span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-700">bottom · {shown(33)}px</span>}
      </div>
    </div>
  </article>
}
export const zonedWinnerWidget=[
  defineWidget({id:"body-widget-official-e",label:"E · Official",icon:Activity,defaultW:1,defaultH:1,defaultAccentColor:"#2563eb",visualizations:[{id:"official",label:"Official"}],render:({accentColor})=> <ProposedZonedE accentColor={accentColor}/>}),
  ...Array.from({length:10},(_,index)=>{
    const letter=String.fromCharCode(66+index);
    return defineWidget({id:`body-widget-composition-${letter.toLowerCase()}`,label:`Composition ${letter}`,icon:Activity,defaultW:1,defaultH:1,defaultAccentColor:exampleAccentHex[index],visualizations:[{id:letter.toLowerCase(),label:letter}],render:({accentColor})=> <ProposedZonedE compositionVariant={index} accentColor={accentColor}/>});
  }),
];
export const stepsUmbrellaWidget=defineWidget({
  id:"body-widget-steps",
  label:"Steps",
  icon:TbWalk,
  defaultW:1,
  defaultH:1,
  defaultAccentColor:"#20a65a",
  visualizations:[
    {id:"hourly-bars",label:"Hourly bars",defaultSize:{w:1,h:1},allowedSizes:[{w:1,h:1},{w:2,h:1},{w:1,h:2},{w:2,h:2}]},
    {id:"goal-ring",label:"Goal ring",defaultSize:{w:1,h:1},allowedSizes:[{w:1,h:1},{w:2,h:1},{w:2,h:2}]},
    {id:"step-field",label:"Step field",defaultSize:{w:1,h:1},allowedSizes:[{w:1,h:1},{w:1,h:2},{w:3,h:1}]},
  ],
  render:({visualizationId,size,accentColor})=><StepsWidget variant={visualizationId as StepsVariantId} size={size} accentColor={accentColor}/>,
});
export const bodyWidgetCollections={
  approvedBodySetV1:zonedWinnerWidget,
  activeTeachingWidget:[stepsUmbrellaWidget],
};
export const hubStyleWidgets=bodyWidgetDesignRegistry.placements
  .map(({placement,letter})=>defineWidget({id:`placement-${letter.toLowerCase()}`,label:`Placement ${letter}`,icon:Activity,defaultW:1,defaultH:1,defaultAccentColor:"#2563eb",visualizations:[{id:letter.toLowerCase(),label:letter}],render:({accentColor})=> <ScaledCard><Candidate placement={placement} theme={accentColor?colorTheme(accentColor):finalBlue} barRadius={7} barHeight={15} trackStrength={10} fontFamily={inter} secondarySize={11} detailSize={11}/></ScaledCard>}));
