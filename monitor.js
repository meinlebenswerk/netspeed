const { spawnSync} = require('child_process');

var rx_regex = new RegExp('(RX\\spackets\\s\\d*\\s\\sbytes\\s)(\\d*)', 'gm');
var tx_regex = new RegExp('(TX\\spackets\\s\\d*\\s\\sbytes\\s)(\\d*)', 'gm');
var interface_regex = new RegExp('.+: ', 'gm');

const interval = 200

let data = {}

let parse_ifconfig_out = (output) => {

  let interfaces =  Array.from(output.matchAll(interface_regex), m => m[0].replace(':', '').trim())
  let rx_bytes =  Array.from(output.matchAll(rx_regex), m => parseInt(m[2]))
  let tx_bytes =  Array.from(output.matchAll(tx_regex), m => parseInt(m[2]))

  for(let i=0; i<interfaces.length; i++){
    let intf = interfaces[i]
    if(data[intf] == undefined){
      data[intf] = {
        rx_bytes: rx_bytes[i],
        tx_bytes: tx_bytes[i]
      }
    }else{
      data[intf].rx_delta = rx_bytes[i] - data[intf].rx_bytes
      data[intf].tx_delta = tx_bytes[i] - data[intf].tx_bytes

      data[intf].rx_bytes = rx_bytes[i]
      data[intf].tx_bytes = tx_bytes[i]
    }
  }
}

let print_stats = () => {
  console.log('\033[2J');
  for( let interface in data){
    if(data[interface].rx_delta == undefined) continue
    console.log(`Interface ${interface} stats:\t
      \treceive: ${(data[interface].rx_delta/interval).toFixed(2)}kB/s
      \tsend: ${(data[interface].tx_delta/interval).toFixed(2)}kB/s
      \ttotal: rx: ${data[interface].rx_bytes} bytes | tx: ${data[interface].tx_bytes} bytes
      \t\n`)
    data[interface].rx_delta
  }
}

let run_ifconfig = () => {
  const child = spawnSync('ifconfig');
  let output = child.output[1].toString();
  parse_ifconfig_out(output)
}

setInterval(run_ifconfig, 500)
setInterval(print_stats, 500)
