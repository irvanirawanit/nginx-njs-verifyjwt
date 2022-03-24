function decodewithverify(r) {
  jwt.return = r;
  //r.return(200, 'ERROR ok');
  //var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o";
  //var token = r.args.token;
  var token = r.headersIn.Authorization.slice(7);
  try {
      var decoded = jwt.decode(token, "vmiAnb1IHfZE0gYoqz6SaLFx7uWXpURr", true, 'HS256');
      //r.headersOut['njsJWT'] = decoded;
      //r.variables['JWTdecoded'] = JSON.stringify(decoded);
      //r.return(200,JSON.stringify(decoded));
      r.internalRedirect('@authprivate');
  } catch (e) {
      r.return(403, 'Forbidden Access.');
  }

}

function jwtdecode(r) {
      var parts = r.headersIn.Authorization.slice(7).split('.').slice(0,2)
              .map(v=>Buffer.from(v, 'base64url').toString())
              .map(JSON.parse);
      return JSON.stringify(parts[1]);
}

// location /keranjang {
//   js_content njs_jwt.decodewithverify;
// }
// location @modulekeranjang {
//   internal;
//   proxy_pass http://apikeranjang;
//   proxy_http_version 1.1;
//   proxy_set_header Upgrade $http_upgrade;
//   proxy_set_header Connection 'upgrade';
//   proxy_set_header Host $host;
//   proxy_set_header X-jwtdecoded $JWTdecode;
//   proxy_cache_bypass $http_upgrade;
// }

/*
* jwt-simple
*
* JSON Web Token encode and decode module for node.js
*
* Copyright(c) 2011 Kazuhito Hokamura
* MIT Licensed
*/

/**
* module dependencies
*/
var crypto = require('crypto');


/**
* support algorithm mapping
*/
var algorithmMap = {
HS256: 'sha256',
HS384: 'sha384',
HS512: 'sha512',
RS256: 'RSA-SHA256'
};

/**
* Map algorithm to hmac or sign type, to determine which crypto function to use
*/
var typeMap = {
HS256: 'hmac',
HS384: 'hmac',
HS512: 'hmac',
RS256: 'sign'
};

/**
 * expose object
 */
 var jwt = {};

 /**
  * version
  */
 jwt.version = '0.5.6';
 
 /**
  * Decode jwt
  *
  * @param {Object} token
  * @param {String} key
  * @param {Boolean} [noVerify]
  * @param {String} [algorithm]
  * @return {Object} payload
  * @api public
  */
 
  jwt.decode = function jwt_decode(token, key, noVerify, algorithm) {
    // check token
    if (!token) {
      throw new Error('No token supplied');
    }
    // check segments
    var segments = token.split('.');
    if (segments.length !== 3) {
      throw new Error('Not enough or too many segments');
    }
  
    // All segment should be base64
    var headerSeg = segments[0];
    var payloadSeg = segments[1];
    var signatureSeg = segments[2];
  
    // base64 decode and parse JSON
      //var header = '';
      //var payload = '';
      //jwt.return.return(200, payloadSeg);
  
      var h = base64urlDecode(headerSeg);
      var p = base64urlDecode(payloadSeg);
  
  
      while (h.charCodeAt((h.length-1)) === 0) {
          h = h.substring(0, h.length - 1);
      }
  
      while (p.charCodeAt((p.length-1)) === 0) {
          p = p.substring(0, p.length - 1);
      }
  
  
    var header = JSON.parse(h);
    var payload = JSON.parse(p);
  
    if (!noVerify) {
      if (!algorithm && /BEGIN( RSA)? PUBLIC KEY/.test(key.toString())) {
        algorithm = 'RS256';
      }
  
      var signingMethod = algorithmMap[algorithm || header.alg];
      var signingType = typeMap[algorithm || header.alg];
      if (!signingMethod || !signingType) {
        throw new Error('Algorithm not supported');
      }
  
      // verify signature. `sign` will return base64 string.
      var signingInput = [headerSeg, payloadSeg].join('.');
      if (!verify(signingInput, key, signingMethod, signingType, signatureSeg)) {
        throw new Error('Signature verification failed');
      }
  
      // Support for nbf and exp claims.
      // According to the RFC, they should be in seconds.
      if (payload.nbf && Date.now() < payload.nbf*1000) {
        throw new Error('Token not yet active');
      }
  
      if (payload.exp && Date.now() > payload.exp*1000) {
        throw new Error('Token expired');
      }
    }
  
    return payload;
  };

  * @param {Object} payload
  * @param {String} key
  * @param {String} algorithm
  * @param {Object} options
  * @return {String} token
  * @api public
  */
 jwt.encode = function jwt_encode(payload, key, algorithm, options) {
   // Check key
   if (!key) {
     throw new Error('Require key');
   }
 
   // Check algorithm, default is HS256
   if (!algorithm) {
     algorithm = 'HS256';
   }
 
   var signingMethod = algorithmMap[algorithm];
   var signingType = typeMap[algorithm];
   if (!signingMethod || !signingType) {
     throw new Error('Algorithm not supported');
   }
 
   // header, typ is fixed value.
   var header = { typ: 'JWT', alg: algorithm };
   if (options && options.header) {
     assignProperties(header, options.header);
   }
 
   // create segments, all segments should be base64 string
   var segments = [];
   segments.push(base64urlEncode(JSON.stringify(header)));
   segments.push(base64urlEncode(JSON.stringify(payload)));
   segments.push(sign(segments.join('.'), key, signingMethod, signingType));
 
   return segments.join('.');
 };
 
 /**
  * private util functions
  */
 
 function assignProperties(dest, source) {
   for (var attr in source) {
     if (source.hasOwnProperty(attr)) {
       dest[attr] = source[attr];
     }
   }
 }
 
 function verify(input, key, method, type, signature) {
 
   if(type === "hmac") {
     return (signature === sign(input, key, method, type));
   }
   else if(type == "sign") {
     return crypto.createVerify(method)
                  .update(input)
                  .verify(key, base64urlUnescape(signature), 'base64');
   }
   else {
     throw new Error('Algorithm type not recognized');
   }
 }

 function sign(input, key, method, type) {
  var base64str;
  if(type === "hmac") {
    base64str = crypto.createHmac(method, key).update(input).digest('base64');
  }
  else if(type == "sign") {
    base64str = crypto.createSign(method).update(input).sign(key, 'base64');
  }
  else {
    throw new Error('Algorithm type not recognized');
  }

  var ret = base64urlEscape(base64str);

  //jwt.return.return(200, ret);

  return ret;
}

function base64urlDecode(str) {
    return Base64.decode(str);

  //return Buffer.from(base64urlUnescape(str), 'base64').toString();
}

function base64urlUnescape(str) {
  str += new Array(5 - str.length % 4).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}

function base64urlEncode(str) {
    return Base64.encode(str);
  //return base64urlEscape(Buffer.from(str).toString('base64'));
}

function base64urlEscape(str) {

    str = str.replace(/\+/g, '-');
    str = str.replace(/\//g, '_');
    str = str.replace(/\=/g, '');
  return str;
}


export default { decodewithverify, jwtdecode };