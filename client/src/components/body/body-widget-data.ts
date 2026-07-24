const average=(values:number[])=>values.reduce((sum,value)=>sum+value,0)/values.length;
const round=(value:number,digits=0)=>Number(value.toFixed(digits));

const recoveryInputs=[
  {label:"Sleep",value:82,weight:.4},
  {label:"Strain",value:63,weight:.25},
  {label:"HRV",value:71,weight:.35},
];
const recoveryScore=Math.round(recoveryInputs.reduce((sum,item)=>sum+item.value*item.weight,0));

const sleepStages=[
  {stage:"light",minutes:56},
  {stage:"deep",minutes:48},
  {stage:"light",minutes:72},
  {stage:"rem",minutes:44},
  {stage:"awake",minutes:12},
  {stage:"deep",minutes:54},
  {stage:"light",minutes:91},
  {stage:"rem",minutes:63},
  {stage:"light",minutes:28},
] as const;
const sleepMinutes=sleepStages.reduce((sum,item)=>sum+item.minutes,0);
const stageMinutes=(stage:string)=>sleepStages.filter(item=>item.stage===stage).reduce((sum,item)=>sum+item.minutes,0);

const heartSamples=[68,66,65,67,64,63,65,61,62,60,62];
const hourlySteps=[0,0,0,0,0,0,180,620,740,410,930,380,1120,840,690,510,730,620,430,270,220,142,0,0];
const hrvSamples=[52,61,48,67,58,73,64];
const stressSamples=[38,44,35,52,48,41,37,29,33,31,32];
const oxygenSamples=[96,97,98,97,99,98,98,97,98,99,98,98];
const respiratorySamples=[13.4,13.8,14.1,14.6,14.9,14.5,14.2];
const temperatureDeviations=[-.1,0,.1,.2,.1,.3,.2];
const activities=[
  {label:"Walk",load:2.1},
  {label:"Strength",load:5.8},
  {label:"Cycling",load:3.4},
  {label:"Daily movement",load:1.1},
];

const totalSteps=hourlySteps.reduce((sum,value)=>sum+value,0);
const strainScore=round(activities.reduce((sum,item)=>sum+item.load,0),1);

export const bodyMetrics={
  recovery:{
    inputs:recoveryInputs,
    score:recoveryScore,
    delta:recoveryScore-71,
    status:recoveryScore>=70?"Ready":"Take it easier",
  },
  sleep:{
    stages:sleepStages,
    totalMinutes:sleepMinutes,
    deepMinutes:stageMinutes("deep"),
    remMinutes:stageMinutes("rem"),
    awakeMinutes:stageMinutes("awake"),
    score:Math.min(100,Math.round((sleepMinutes/480)*86)),
  },
  heart:{
    samples:heartSamples,
    current:heartSamples.at(-1)!,
    resting:Math.min(...heartSamples)-2,
    high:121,
  },
  steps:{
    hourly:hourlySteps,
    total:totalSteps,
    goal:10000,
    distanceKm:round(totalSteps*.00075,1),
    activeCalories:Math.round(totalSteps*.0615),
  },
  hrv:{
    samples:hrvSamples,
    current:hrvSamples.at(-1)!,
    average:Math.round(average(hrvSamples)),
    deltaPercent:Math.round(((hrvSamples.at(-1)!-hrvSamples[0])/hrvSamples[0])*100),
  },
  stress:{
    samples:stressSamples,
    current:stressSamples.at(-1)!,
    peak:Math.max(...stressSamples),
    calmMinutes:stressSamples.filter(value=>value<35).length*12,
  },
  oxygen:{
    samples:oxygenSamples,
    average:Math.round(average(oxygenSamples)),
    low:Math.min(...oxygenSamples),
    high:Math.max(...oxygenSamples),
    drops:oxygenSamples.filter(value=>value<95).length,
  },
  respiratory:{
    samples:respiratorySamples,
    average:round(average(respiratorySamples),1),
    low:Math.min(...respiratorySamples),
    high:Math.max(...respiratorySamples),
  },
  temperature:{
    deviations:temperatureDeviations,
    latest:temperatureDeviations.at(-1)!,
    average:round(average(temperatureDeviations),1),
  },
  strain:{
    activities,
    score:strainScore,
    targetLow:10,
    targetHigh:14,
  },
} as const;
