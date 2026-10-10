import { TILE as T, type World, type BlockKind, type ItemKind, type Enemy, type Theme } from './types'
export const worlds = [
  {name:'青风草原',subtitle:'每一场冒险，都从第一跳开始。',theme:'meadow' as Theme,mark:'❀'},
  {name:'萤石地底',subtitle:'跟随微光，发现藏在地下的秘密。',theme:'cave' as Theme,mark:'◆'},
  {name:'云上群岛',subtitle:'再勇敢一点，天空也会为你让路。',theme:'sky' as Theme,mark:'☁'},
  {name:'余烬城堡',subtitle:'越过火焰，去迎接故事的结尾。',theme:'castle' as Theme,mark:'♜'},
]
export function createWorld(index:number, bonus=false):World {
  const meta=worlds[index], w:World={...meta,index,width:(bonus?29:index===3?132:148)*T,blocks:[],enemies:[],pickups:[],platforms:[],spawn:{x:100,y:400},goal:(index===3?124:140)*T,checkpoint:0,checkpointY:400}
  const block=(x:number,y:number,kind:BlockKind='brick',content?:ItemKind)=>{
    const old=w.blocks.find(b=>b.x===x*T&&b.y===y*T&&b.w===T)
    if(old){old.kind=kind;old.content=content;return}
    w.blocks.push({x:x*T,y:y*T,w:T,h:T,kind,content,bump:0,broken:false})
  }
  const ground=(from:number,to:number,y=12)=>{for(let x=from;x<to;x++)for(let row=y;row<14;row++)block(x,row,'ground')}
  const row=(a:number,b:number,y:number,kind:BlockKind='brick')=>{for(let x=a;x<=b;x++)block(x,y,kind)}
  const coins=(a:number,b:number,y:number)=>{for(let x=a;x<=b;x++)w.pickups.push({x:x*T+11,y:y*T+8,w:18,h:24,baseY:y*T+8,kind:'coin',vx:0,vy:0,active:true,emerge:0,id:-1})}
  const medal=(x:number,y:number,id:number)=>w.pickups.push({x:x*T+3,y:y*T,w:34,h:34,baseY:y*T,kind:'medal',vx:0,vy:0,active:true,emerge:0,id})
  const enemy=(x:number,kind:Enemy['kind']='goomba',y=11)=>{
    const h=kind==='boss'?96:kind==='turtle'?42:kind==='plant'?44:30
    w.enemies.push({x:x*T+4,y:kind==='plant'?y*T:(y+1)*T-h,w:kind==='boss'?100:30,h,kind,vx:kind==='boss'?-55:kind==='plant'?0:-45,vy:0,alive:true,grounded:false,phase:x*.7,hit:0,homeX:x*T+4,homeY:y*T,hp:kind==='boss'?8:1})
  }
  const pipe=(x:number,height=2,plant=false)=>{for(let j=0;j<height;j++){w.blocks.push({x:x*T,y:(12-height+j)*T,w:2*T,h:T,kind:'pipe',pipeTop:j===0,bump:0,broken:false})}if(plant)enemy(x+.6,'plant',12-height-1)}
  const stairs=(x:number,n:number)=>{for(let i=0;i<n;i++)for(let j=0;j<=i;j++)block(x+i,11-j,'stone')}
  const platform=(x:number,y:number,axis:'x'|'y',range:number,speed=.75)=>w.platforms.push({x:x*T,y:y*T,w:3*T,h:18,homeX:x*T,homeY:y*T,axis,range:range*T,speed,phase:0,dx:0,dy:0})
  if(bonus){
    w.theme='bonus';w.name='金币密室';w.width=29*T;w.goal=999999;w.checkpoint=0;w.spawn={x:100,y:400};ground(0,29);row(0,28,2,'stone');
    for(let i=0;i<3;i++)row(5+i*6,8+i*6,9-i,'brick')
    coins(3,22,10);coins(5,8,7);coins(11,14,6);coins(17,20,5);block(21,8,'question','life');pipe(25,2);w.exit={x:25*T,y:10*T};return w
  }
  if(index===0){
    ground(0,28);ground(31,55);ground(58,83);ground(87,110);ground(113,148)
    block(8,9,'question','coin');row(12,16,9);w.blocks.find(b=>b.x===14*T&&b.y===9*T)!.content='mushroom';w.blocks.find(b=>b.x===14*T&&b.y===9*T)!.kind='question'
    block(14,5,'question','coin');enemy(18);pipe(22,2);coins(22,23,8);coins(27,31,8);medal(29,7.5,0)
    row(34,37,9);block(36,9,'question','flower');enemy(39);enemy(43);pipe(46,2);w.warp={x:46*T,y:10*T}
    coins(47,49,7);row(51,53,9);block(52,9,'question','star');coins(55,58,8);enemy(62,'turtle');w.checkpoint=65*T
    pipe(69,2,true);row(73,77,9);row(76,79,6);medal(78,5,1);block(74,9,'question','mushroom');enemy(80);coins(83,87,8)
    stairs(92,3);coins(94,99,7);enemy(101,'turtle');row(104,107,9);block(106,9,'question','coin');coins(109,113,8)
    pipe(118,3,true);medal(119,7,2);enemy(124);enemy(126);stairs(129,5)
  } else if(index===1){
    ground(0,24);ground(27,49);ground(52,78);ground(82,103);ground(107,148)
    row(0,19,2,'stone');row(32,47,2,'stone');row(57,78,2,'stone');row(89,102,2,'stone');row(117,130,2,'stone')
    block(8,9,'question','mushroom');row(12,18,8);coins(12,18,6);enemy(16);enemy(21,'turtle');coins(23,27,8)
    row(30,35,9);block(32,9,'question','flower');row(35,38,6);medal(37,5,0);enemy(39);pipe(43,2,true)
    platform(48,10,'y',2,.85);coins(49,52,7);enemy(57,'turtle');row(61,66,9);block(64,9,'question','star');w.checkpoint=70*T
    row(73,77,8);coins(73,77,6);medal(79,7,1);platform(78,10,'x',2,.9)
    pipe(86,2);w.warp={x:86*T,y:10*T};enemy(91);enemy(94,'turtle');row(96,100,9);block(98,9,'question','mushroom')
    coins(102,108,8);platform(104,10,'y',1.5,.8);stairs(113,3);row(117,121,8);medal(120,6,2);enemy(123,'turtle');stairs(129,5)
  } else if(index===2){
    ground(0,16);ground(20,31,11);ground(35,47);ground(51,62,10);ground(67,78,12);ground(82,94,11);ground(98,109);ground(113,148)
    block(8,9,'question','mushroom');coins(13,20,7);platform(16,11,'y',1.5);medal(18,7,0);enemy(25,'turtle',9)
    row(25,28,8);block(27,8,'question','flower');coins(30,35,7);platform(31,10,'x',2,.6)
    enemy(41);row(43,46,9);coins(47,51,6);platform(47,9,'y',1.5);enemy(57,'turtle',8);block(55,7,'question','star');medal(59,6,1)
    platform(62,10,'x',2.5,.6);coins(62,67,7);w.checkpoint=71*T;block(73,9,'question','mushroom')
    platform(78,10,'y',2,.75);coins(78,83,7);enemy(88,'turtle',9);row(87,91,8);coins(93,98,7)
    platform(94,10,'x',2,.7);enemy(103);row(104,107,9);block(106,9,'question','flower');coins(109,114,7);medal(111,6,2);platform(109,9,'y',1.5)
    pipe(119,2);enemy(123,'turtle');stairs(128,6)
  } else {
    ground(0,23);ground(27,46);ground(50,69);ground(73,93);ground(97,132)
    row(0,20,2,'stone');row(30,44,2,'stone');row(55,67,2,'stone');row(77,91,2,'stone');row(97,131,1,'stone')
    block(7,9,'question','mushroom');row(12,15,9,'stone');enemy(18,'turtle');coins(22,27,8);platform(23,10,'x',1)
    row(30,34,9,'stone');row(34,37,6,'stone');medal(36,5,0);block(31,9,'question','flower');enemy(39,'turtle');pipe(42,2,true)
    platform(46,10,'y',1.5);coins(46,50,7);w.checkpoint=55*T;block(57,9,'question','mushroom');row(61,65,9,'stone');medal(63,7,1)
    enemy(66);platform(69,10,'x',1.5);coins(69,73,7);pipe(78,2,true);row(82,85,9);block(84,9,'question','star')
    enemy(87,'turtle');medal(92,8,2);platform(93,10,'y',1.5);coins(92,98,7)
    block(101,9,'question','flower');w.bossGate=104*T;enemy(114,'boss',9);w.goal=125*T
  }
  return w
}
