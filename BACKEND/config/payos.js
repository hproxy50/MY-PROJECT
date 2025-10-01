// config/payos.js
import { PayOS } from '@payos/node';


const payos = new PayOS('70fa717a-5a37-4de7-b2b7-64824220c8e6'
  ,'6dcfe3e5-d27e-4c86-8693-98b498d63e1a'
  ,'76a287765105f4ed2f3f7ade329568fd87be543adb48fd584ca6e9aed05590e7')

  console.log("PayOS instance:", payos);
export default payos;
