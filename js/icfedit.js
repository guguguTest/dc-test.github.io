function crc32(data, crc) {
	var table = crc32.table;
	if (!table) {
		table = new Int32Array(256);
		var mask = new Int32Array(1);
		mask[0] = 0xEDB88320;
		for (var i = 0; i < 256; i++) {
			table[i] = i;
			for (var z = 8; z; z--) {
				table[i] = (table[i] & 1) ? (table[i] >>> 1) ^ mask[0] : table[i] >>> 1;
			}
		}
		crc32.table = table;
	}

	if (!crc) {
		crc = new Int32Array(1);
	}
	crc[0] = ~crc[0];
	for (var i = 0; i < data.length; i++) {
		crc[0] = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	crc[0] = ~crc[0];
	return crc[0];
}

var HEX="0123456789abcdef";

function hex2bin(text) {
	var len = text.length >> 1;
	var result = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		var val = parseInt(text.substr(i*2, 2), 16);
		if (isNaN(val)) {
			return null;
		}
		result[i] = val;
	}
	return result;
}

function bin2hex(bytes) {
	var result = "";
	for (var i = 0; i < bytes.length; i++) {
		var v = bytes[i];
		result += HEX[v >> 4] + HEX[v & 0xf];
	}
	return result;
}

function dec2(val) {
	if (val < 10) return "0" + val;
	return val.toString();
}

function dec4(val) {
	if (val < 10) return "000" + val;
	if (val < 100) return "00" + val;
	if (val < 1000) return "0" + val;
	return val.toString();
}

function xxd_encode(bytes, offset, newline) {
	offset ||= 0;
	newline ||= '\n';
	var ret = "";
	var slice = [];
	for (var ptr = 0; ptr < bytes.length; ptr += 16) {
		var label = (offset+ptr).toString(16);
		while (label.length < 4)
			label = '0' + label;
		ret += '0000' + label + ': ';
		for (var i = 0; i < 16; i += 2) {
			var a = bytes[ptr + i], b = bytes[ptr + i + 1];
			ret += HEX[a >> 4] + HEX[a & 0xf] + HEX[b >> 4] + HEX[b & 0xf] + ' ';
			slice[i]   = (a >= 0x20 && a <= 0x7e) ? a : 0x2e;
			slice[i+1] = (b >= 0x20 && b <= 0x7e) ? b : 0x2e;
		}
		ret += ' ' + String.fromCharCode(...slice) + newline;
	}
	return ret;
}

function xxd_decode(text) {
	var lines = text.split('\n');
	var hexits = "";
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (line.length == 0)
			continue;
		var colon = line.indexOf(':');
		if (colon == -1)
			return null;
		line = line.slice(colon+1, -16).trim();
		var hex_cnt = 0;
		for (var j = 0; j < line.length; j++) {
			if (line[j] == ' ')
				continue;
			hexits += line[j];
			hex_cnt++;
		}
		if (hex_cnt != 32)
			return null;
	}
	return hex2bin(hexits);
}

var icf_key = hex2bin('09ca5efd30c9aaef3804d0a7e3fa7120');
var icf_iv  = hex2bin('b155c22c2e7f0491fa7f0fdc217aff90');

function icf_sanity_error(data) {
	if (!data) {
		return 'Invalid input';
	}
	var buffer = data.buffer;

	if (data.length < 0x40) {
		return 'Bad length';
	}

	// Length
	var len = new Int32Array(buffer, 4, 1);
	if (len[0] != data.length) {
		return 'Bad length';
	}

	// Overall CRC
	var crcsum = new Int32Array(buffer, 0, 1);
	var crc_range = new Uint8Array(buffer, 4);
	if (crc32(crc_range) != crcsum[0]) {
		return 'Bad CRC';
	}

	// Section CRC
	var enc_sections = new Uint16Array(buffer, 0x10, 1);
	var num_sections = data.length / 0x40;
	if (enc_sections[0] != num_sections - 1) {
		return "Bad section count";
	}

	var crc2 = new Int32Array(1);
	for (var i = 1; i < num_sections; i++) {
		var secdata = new Uint8Array(buffer, i*0x40, 0x40);
		if (secdata[0] != 2 || secdata[1] != 1) {
			continue;
		}
		crc2[0] ^= crc32(secdata);
	}
	var crcsum2 = new Int32Array(buffer, 0x20, 1);
	if (crcsum2[0] != crc2[0]) {
		return "Bad section CRC";
	}

	return null;
}

function icf_decrypt(data) {
	if (data.length & 0xf) {
		console.error('Attempted to decrypt non-full data block');
		return null;
	}
	var aesCbc = new aesjs.ModeOfOperation.cbc(icf_key, icf_iv);
	return aesCbc.decrypt(data);
}

function icf_encrypt(data) {
	if (data.length & 0xf) {
		console.error('Attempted to encrypt non-full data block');
		return null;
	}
	var aesCbc = new aesjs.ModeOfOperation.cbc(icf_key, icf_iv);
	return aesCbc.encrypt(data);
}

function icf_decodeVersion(vals, zeropad) {
	var major = (vals[3] << 8) | vals[2];
	if (zeropad) {
		major = dec4(major);
	}
	return major + '.' + dec2(vals[1]) + '.' + dec2(vals[0]);
};

function icf_encodeVersion(str, vals) {
	var parts = str.split('.');
	if (parts.length != 3) {
		return false;
	}
	var major = parseInt(parts[0]);
	var minor = parseInt(parts[1]);
	var build = parseInt(parts[2]);
	if (isNaN(major) || isNaN(minor) || isNaN(build)) {
		return false;
	}

	vals[0] = build;
	vals[1] = minor;
	vals[2] = major & 0xff;
	vals[3] = major >> 8;

	return true;
};

function icf_decodeTime(vals) {
	var year = (vals[1] << 8) | vals[0];
	return dec4(year) + dec2(vals[2]) + dec2(vals[3]) + dec2(vals[4]) + dec2(vals[5]) + dec2(vals[6]);
};

function icf_encodeTime(str, vals) {
	if (str.length != 14) {
		return false;
	}
	var year  = parseInt(str.substr(0, 4));
	var month = parseInt(str.substr(4, 2));
	var day   = parseInt(str.substr(6, 2));
	var hrs   = parseInt(str.substr(8, 2));
	var min   = parseInt(str.substr(10, 2));
	var sec   = parseInt(str.substr(12, 2));

	if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hrs) || isNaN(min) || isNaN(sec)) {
		return false;
	}

	vals[0] = year & 0xff;
	vals[1] = year >> 8;
	vals[2] = month;
	vals[3] = day;
	vals[4] = hrs;
	vals[5] = min;
	vals[6] = sec;

	return true;
};

function icf_encode(entries) {
	var data = new Uint8Array(entries.length * 0x40);
	var buffer = data.buffer;
	var ret = [data];

	// Process header, encode later
	var matches = /^(\w{4})(\w{3})(\d)$/.exec(entries[0]);
	var gameid = 'SXXX';
	var platid = 'AXX';
	var platgen = -1;
	if (matches) {
		gameid = matches[1];
		platid = matches[2];
		platgen = parseInt(matches[3]);
	}

	var outcnt = 0;
	var sysver = new Uint8Array(4);
	var app_part = 0, app_last_ver, app_last_time;

	var datanames = {};
	var patchNum = 0x001;

	// Process sections
	for (var i = 1; i < entries.length; i++) {
		var base = i * 0x40;
		var magic        = new Uint16Array(buffer, base+0, 1);
		var type         = new Uint32Array(buffer, base+4, 1);
		var ver          = new Uint8Array (buffer, base+0x20, 4);
		var time         = new Uint8Array (buffer, base+0x24, 8);
		var platver      = new Uint8Array (buffer, base+0x2c, 4);
		var base_ver     = new Uint8Array (buffer, base+0x30, 4);
		var base_time    = new Uint8Array (buffer, base+0x34, 8);

		if (entries[i][0] == '!') {
			var oldbuf = window.icfdata.buffer;
			var olddata = new Uint8Array(oldbuf, i*0x40, 0x40);
			ret[i] = xxd_encode(olddata, i*0x40, '<br>');
			continue;
		}
		matches = /^([A-Z]+)_([^_]+)_(\d+)_(\d+)(_[^_]+)?\.(\w+)$/.exec(entries[i]);
		if (!matches) {
			ret[i] = 'Malformed entry filename';
			continue;
		}
		var e_gameid = matches[1];
		var e_dataname = matches[2];
		var e_timestamp = matches[3];
		var e_part = parseInt(matches[4]);
		var e_base = matches[5] ? matches[5].substr(1) : null;
		var e_type = matches[6];

		if (datanames[entries[i]]) {
			ret[i] = 'Duplicate entry?';
			continue;
		} else {
			datanames[entries[i]] = i;
		}

		magic[0] = 0x102;
		if (!icf_encodeTime(e_timestamp, time)) {
			ret[i] = 'Malformed timestamp';
			continue;
		}
		switch (e_type) {
			case 'pack':
				type[0] = 0;
				if (e_gameid != platid) {
					ret[i] = 'Platform ID mismatch: ' + platid + ' expected';
					continue;
				}
				if (e_part != 0 || e_base) {
					ret[i] = 'SYSTEM image may not be layered';
					continue;
				}
				if (sysver[0] || sysver[1] || sysver[2] || sysver[3]) {
					ret[i] = 'Redundant SYSTEM image';
					continue;
				}
				if (!icf_encodeVersion(e_dataname, ver)) {
					ret[i] = 'Malformed version';
					continue;
				}
				sysver = ver;
				platver.set(sysver);
				break;
			case 'app':
				type[0] = 1;
				if (e_gameid != gameid) {
					ret[i] = 'Game ID mismatch: ' + gameid + ' expected';
					continue;
				}
				if (e_part != app_part) {
					ret[i] = 'APP index out of order: part ' + app_part + ' expected';
					continue;
				}
				if ((e_part == 0 && e_base) || (e_part != 0 && e_base != app_last_ver)) {
					ret[i] = 'APP base image mismatch';
					continue;
				}
				if (!icf_encodeVersion(e_dataname, ver)) {
					ret[i] = 'Malformed version';
					continue;
				}
				platver.set(sysver);
				if (e_part > 0) {
					patchNum += 0x100;
					type[0] = patchNum;
					icf_encodeVersion(e_base, base_ver);
					base_time.set(app_last_time);
				}
				app_part++;
				app_last_ver = e_dataname;
				app_last_time = time;
				break;
			case 'opt':
				type[0] = 2;
				if (e_gameid != gameid) {
					ret[i] = 'Game ID mismatch: ' + gameid + ' expected';
					continue;
				}
				if (e_part != 0 || e_base) {
					ret[i] = 'OPT image may not be layered';
					continue;
				}
				ver[0] = e_dataname.charCodeAt(0);
				ver[1] = e_dataname.charCodeAt(1);
				ver[2] = e_dataname.charCodeAt(2);
				ver[3] = e_dataname.charCodeAt(3);
				break;
			default:
				ret[i] = 'Unknown file type: ' + e_type;
				continue;
		}

		// OK
		ret[i] = new Uint8Array(buffer, base, 0x40);
		outcnt++;
	}

	if (outcnt+1 != entries.length) {
		ret[0] = 'Invalid section(s) exists';
	} else if (platgen < 0) {
		ret[0] = 'Malformed header. Example: SDEZACA0';
	} else {
		// ALL GOOD. Populate header and calculate checksum
		var crc1 = new Int32Array(buffer, 0, 1);
		var _crc1_range = new Uint8Array(buffer, 4);
		var len = new Uint16Array(buffer, 4, 1);
		var num_sections = new Uint16Array(buffer, 0x10, 1);
		var titleData = new Uint8Array(buffer, 0x18, 8);
		var crc2 = new Int32Array(buffer, 0x20, 1);

		len[0] = data.length;
		num_sections[0] = outcnt;
		titleData[0] = gameid.charCodeAt(0);
		titleData[1] = gameid.charCodeAt(1);
		titleData[2] = gameid.charCodeAt(2);
		titleData[3] = gameid.charCodeAt(3);
		titleData[4] = platid.charCodeAt(0);
		titleData[5] = platid.charCodeAt(1);
		titleData[6] = platid.charCodeAt(2);
		titleData[7] = platgen;

		crc2[0] = 0;
		for (var i = 1; i < entries.length; i++) {
			crc2[0] ^= crc32(ret[i]);
		}
		crc1[0] = crc32(_crc1_range);

		ret[0] = new Uint8Array(buffer, 0, 0x40);
	}

	return ret;
}

function icf_decode(data) {
	var buffer = data.buffer;
	var entries = [];

	// Header
	var hdrerr = icf_sanity_error(data);
	var gameid = "SXXX";
	var platid = "AXX";
	if (hdrerr) {
		platbuf = new Uint8Array([]);
		entries[0] = '! ' + hdrerr;
	} else {
		platbuf = new Uint8Array(buffer, 0x18, 8);
		gameid = String.fromCharCode(platbuf[0], platbuf[1], platbuf[2], platbuf[3]);
		platid = String.fromCharCode(platbuf[4], platbuf[5], platbuf[6]);
		entries[0] = gameid + platid + platbuf[7];
	}

	var num_sections = data.length / 0x40;
	var sysver = null;
	var app_part = 0, app_last_ver, app_last_time;

	var datanames = {};
	var patch_num = 0x101;

	for (var i = 1; i < num_sections; i++) {
		var base = i * 0x40;
		var magic        = new Uint16Array(buffer, base+0, 1);
		var type         = new Uint32Array(buffer, base+4, 1);
		var ver          = new Uint8Array (buffer, base+0x20, 4);
		var time         = new Uint8Array (buffer, base+0x24, 8);
		var platver      = new Uint32Array(buffer, base+0x2c, 1);
		var base_ver     = new Uint8Array (buffer, base+0x30, 4);
		var base_time    = new Uint8Array (buffer, base+0x34, 8);

		if (magic[0] != 0x102) {
			entries[i] = '! Invalid Magic';
			continue;
		}
		// Generate filename
		var pfx = '', sfx = '', dataname = '', basename = '';
		var timestamp = icf_decodeTime(time);

		switch (type[0]) {
			case 0: // SYS
				sfx = '0.pack';
				pfx = platid;
				dataname = icf_decodeVersion(ver, true);
				if (sysver) {
					entries[i] = '! Redundant SYSTEM image';
					continue;
				}
				sysver = platver;
				break;
			case patch_num: // APP PATCH
				patch_num += 0x100;
				app_part++;
				dataname = icf_decodeVersion(ver);
				basename = icf_decodeVersion(base_ver);
				if (basename != app_last_ver) {
					app_last_ver = dataname;
					entries[i] = '! Unable to locate base APP ' + basename;
					continue;
				}
				app_last_ver = dataname;
				var basetime = icf_decodeTime(base_time);
				if (basetime != app_last_time) {
					app_last_time = timestamp;
					entries[i] = '! Base APP timestamp mismatch';
					continue;
				}
				app_last_time = timestamp;
				sfx = app_part + '_' + basename + '.app';
				// fall thru
			case 1: // APP
				dataname = icf_decodeVersion(ver);
				app_last_ver = dataname;
				app_last_time = timestamp;
				if (platver[0] != sysver[0]) {
					entries[i] = '! SYSTEM version mismatch';
					continue;
				}
				pfx = gameid;
				dataname = icf_decodeVersion(ver);

				if (!basename) {
					if (app_part) {
						entries[i] = '! Redundant base APP';
						continue;
					}
					sfx = '0.app';
				}
				break;
			case 2: // OPT
				sfx = '0.opt';
				pfx = gameid;
				dataname = String.fromCharCode(...Array.from(ver));
				break;
			default:
				entries[i] = '! Unknown Type: ' + type[0].toString(16);
				continue;
		}

		entries[i] = pfx + '_' + dataname + '_' + timestamp + '_' + sfx;

		if (dataname[entries[i]]) {
			entries[i] = '! Duplicate entry?';
		} else {
			dataname[entries[i]] = i;
		}
	}

	return entries;
}

function icf_infer_filename(data) {
	var buffer = data.buffer;

	// Header
	if(icf_sanity_error(data)) {
		return null;
	}
	var platbuf = new Uint8Array(buffer, 0x18, 8);
	var gameid = String.fromCharCode(platbuf[0], platbuf[1], platbuf[2], platbuf[3]);
	var platid = String.fromCharCode(platbuf[4], platbuf[5], platbuf[6]);
	var romver = '';
	var dataver = '';

	var num_sections = data.length / 0x40;
	var patch_num = 0x101;
	for (var i = 1; i < num_sections; i++) {
		var base = i * 0x40;
		var magic        = new Uint16Array(buffer, base+0, 1);
		var type         = new Uint32Array(buffer, base+4, 1);
		var ver          = new Uint8Array (buffer, base+0x20, 4);

		if (magic[0] != 0x102) {
			continue;
		}
		switch (type[0]) {
			case patch_num: // APP PATCH
				patch_num += 0x100;
			case 1: // APP
				romver = icf_decodeVersion(ver);
				break;
			case 2: // OPT
				dataname = String.fromCharCode(...Array.from(ver));
				if (dataname.localeCompare(dataver) > 0) {
					dataver = dataname;
				}
				break;
		}
	}
	if (dataver) {
		dataver = '_' + dataver;
	}

	return gameid + '_' + platid + '_' + romver + dataver + '.icf';
}
