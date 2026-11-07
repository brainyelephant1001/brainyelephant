'use strict';
// Dates are explicit instants so deployment restarts never restart the offer.
function offer(env=process.env,now=Date.now()){
 const start=Date.parse(env.ESOL_OFFER_START||''),end=Date.parse(env.ESOL_OFFER_END||'');
 const scheduled=Number.isFinite(start)&&Number.isFinite(end)&&end>start;
 const introductory=!scheduled||now<end;
 const amount=introductory?2999:4999;
 const format=n=>'£'+(n/100).toFixed(2);
 const date=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'long',year:'numeric'}).format(t);
 return {scheduled,started:scheduled&&now>=start,introductory,amount,label:format(amount),priceId:introductory?env.ESOL_STRIPE_PRICE_ID:env.ESOL_STRIPE_STANDARD_PRICE_ID,
 message:introductory?'Six-month introductory offer: £29.99. Standard price after the offer: £49.99.':'Standard price: £49.99 one-off.',
 dates:scheduled?'Introductory offer: '+date(start)+' to '+date(end-1)+'. New checkouts cost £49.99 from '+date(end)+' (UK time).':'The six-month offer starts when paid enrolment opens. The closing date will be shown here before payments open.'};
}
module.exports={offer};
