var net = require('net');
var self = {};
self.conf = {};
self.conf.port = 25560;
self.conf.name = "A NodeJS MC Server";

var Server = function(){
	this.packets = {};
	
	this.packets["0"] = function(){
		console.log("Server Identification");
		
		var data = [0x00,0x07,"NodeJS Server","The MOTD",0x00];
		var structure = ["byte","byte","string","string","byte"];
		
		var packet = self.protocol.construct(structure,data);
		console.log(packet);
		return packet;
	}
}
self.server = new Server();

var Protocol = function(){
	this.lengths = {};
	this.lengths.byte = 1;
	this.lengths.sbyte = 1;
	this.lengths.short = 2;
	this.lengths.string = 64;
	this.lengths.bytearray = 1024;
	
	this.parse = function(structure,data){
		// Parses the incoming data.
		
		// Convert the buffer to an array.
		var arr = [];
		for (var d in data) {
			arr.push(data[d]);
		}
		
		var out = {};
		var pos = 0;
		for (var s in structure) {
			var len = 0;
			if (typeof this.lengths[structure[s].toLowerCase()] != "undefined") {
				len = this.lengths[structure[s].toLowerCase()];
			} else {
				console.log("Unknown Structure "+structure[s].toLowerCase());
			}
			
			console.log(s+" = "+structure[s]);
			var d = data.slice(pos,pos+len);
			console.log(d);
			
			// Convert from the buffer to a useable format.
			if (typeof this.to[structure[s].toLowerCase()] != "undefined") {
				d = this.to[structure[s].toLowerCase()](d);
			}
			pos += len;
			
			out[s] = d;
		}
		return out;
	}
	this.construct = function(structure,data) {
		// Feed it a structure and data and it'll return a buffer.
		var size = 0;
		for (var s in structure) {
			if (typeof this.lengths[structure[s].toLowerCase()] != "undefined") {
				size += this.lengths[structure[s].toLowerCase()];
			}
		}
		console.log("Buffer will be "+size+" ocets in size.");
		var buff = new Buffer(size);
		for (var s in structure) {
			console.log("Writing a "+structure[s]+" with the value of : "+data[s]);
			if (typeof this.from[structure[s].toLowerCase()] != "undefined") {
				buff = this.from[structure[s].toLowerCase()](buff,data[s]);
			} else {
				console.log("Unknown TYPE "+structure[s]);
			}
		}
		
		return buff;
	}
	/* Conversions */
	this.to = {};
	this.to.string = function(data){
		return data.toString().trim();
	}
	this.to.byte = function(data){
		var d = data;
		if (typeof data[0] != "undefined") {
			d = parseInt(data[0],16);
		}
		return d;
	}
	this.to.sbyte = function(data){
		return data;
	}
	this.to.short = function(data){
		return parseInt(data);
	}
	this.to.bytearray = function(data){
		return data;
	}
	this.from = {};
	this.from.string = function(buffer,data){
		// Padd it with spaces.
		if (data.length < 64) data = data+Array(64-data.length).join(" ");
		
		// Write to buffer.
		var buf = new Buffer(data.length);
		buf.write(data);
		buffer.concat([buf]);
		return buffer;
	}
	this.from.byte = function(buffer,data){
		console.log("FROM BYTE NOM");
		
		
		console.log(data);
		//buffer.write(parseInt(data));
		//var buf = new Buffer(1);
		var buf = new Buffer([parseInt(data)]);
		console.log(buf);
		console.log(buffer);
		//buf.writeUInt8(data,0);
		buffer.concat([buf],1);
		return buffer;
	}
	this.from.sbyte = function(buffer,data){
		return buffer;
	}
	this.from.short = function(buffer,data){
		return buffer;
	}
	this.from.bytearray = function(buffer,data){
		return buffer;
	}
}
self.protocol = new Protocol();

var Player = function(sock){
	this.socket = sock;
	this.packets = {};
	this.packets["0"] = function(data){
		var structure = {"packet_id":"byte","protocol_ver":"byte","username":"string","ver_key":"string","unused":"byte"};
		console.log("Player Identification");
		var data = self.protocol.parse(structure,data);
		console.log("The player "+data['username']+" has connected.");
		
		// Send the welcome to the user.
		var out = self.server.packets["0"]();
		console.log("ID DATA");
		console.log(out);
		stream = new BufferStream(out);
		stream.pipe(sock);
		//sock.write(out);
	}
	this.packets["05"] = function(data){
		console.log("Set Block");
	}
	this.packets["08"] = function(data){
		console.log("Position and Orientation");
	}
	this.packets["0d"] = function(data){
		console.log("Message");
	}
}
var sock = net.createServer(function(c) { //'connection' listener
	console.log('client connected');
	c.on('end', function() {
		console.log('client disconnected');
	});
	
	c.on('data',function(d){
		var p = new Player(c);
		if (typeof p.packets[d[0].toString()] != "undefined") {
			p.packets[d[0].toString()](d);
		} else {
			console.log("Unknown Packet ID "+d[0].toString());
		}
	});
	//c.pipe(c);
});
sock.listen(self.conf.port, function() { //'listening' listener
	console.log('server bound');
});