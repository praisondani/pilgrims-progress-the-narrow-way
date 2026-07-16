const sceneTones:Record<string,number>={dream:98,city:82,field:147,slough:73,worldly:123,gate:110,interpreter:165,cross:220}
class GameAudio {
  private ctx?:AudioContext;private master?:GainNode;private drone?:OscillatorNode;private droneGain?:GainNode;private noise?:AudioBufferSourceNode;private filter?:BiquadFilterNode;private lastStep=0;private enabled=true
  start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.18;this.master.connect(this.ctx.destination);this.buildAmbience()}this.ctx.resume()}
  setEnabled(value:boolean){this.enabled=value;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(value?.18:0,this.ctx.currentTime,.08);if(value)this.start()}
  private buildAmbience(){if(!this.ctx||!this.master)return;this.drone=this.ctx.createOscillator();this.drone.type='sine';this.drone.frequency.value=98;this.droneGain=this.ctx.createGain();this.droneGain.gain.value=.055;this.drone.connect(this.droneGain).connect(this.master);this.drone.start()
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.32
    this.noise=this.ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=420;const gain=this.ctx.createGain();gain.gain.value=.035;this.noise.connect(this.filter).connect(gain).connect(this.master);this.noise.start()
  }
  scene(id:string){if(!this.enabled)this.setEnabled(false);this.start();if(!this.ctx)return;this.drone?.frequency.setTargetAtTime(sceneTones[id]??110,this.ctx.currentTime,1.8);this.filter?.frequency.setTargetAtTime(id==='slough'?240:id==='cross'?900:480,this.ctx.currentTime,1)}
  tone(freq:number,duration=.18,volume=.12,type:OscillatorType='sine'){if(!this.enabled)return;this.start();if(!this.ctx||!this.master)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.master);o.start();o.stop(this.ctx.currentTime+duration)}
  interact(){this.tone(440,.12,.11,'triangle');setTimeout(()=>this.tone(660,.2,.08,'triangle'),65)}
  dialogue(){this.tone(220,.07,.035,'sine')}
  chapter(){[220,330,440,660].forEach((f,i)=>setTimeout(()=>this.tone(f,.45,.065,'triangle'),i*120))}
  error(){this.tone(95,.2,.08,'sawtooth')}
  walking(moving:boolean,mud=false){if(!moving||!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;if(now-this.lastStep<(mud?.48:.34))return;this.lastStep=now;this.tone(mud?72:105,.09,mud?.07:.045,'sine')}
}
export const gameAudio=new GameAudio()
