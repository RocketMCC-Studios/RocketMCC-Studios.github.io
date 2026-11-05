var __b=(self.location.pathname.match(/^(.*?\/)uu\//)||self.location.pathname.match(/^(.*\/)/))[1];
self.__uv$config = {
	prefix: __b+"uu/data/",
	encodeUrl: Ultraviolet.codec.xor.encode,
	decodeUrl: Ultraviolet.codec.xor.decode,
	handler: __b+"uu/h.js",
	client: __b+"uu/cl.js",
	bundle: __b+"uu/b.js",
	config: __b+"uu/c.js",
	sw: __b+"uu/w.js",
	inject: [{
		host: ".*",
		injectTo: "head",
		html: "<script>(function(){try{Object.defineProperty(window,'frameElement',{get:function(){return null},configurable:true})}catch(e){}try{var p=window.PluginArray&&PluginArray.prototype,n=p&&p.namedItem;if(n)p.namedItem=function(x){return /pdf/i.test(String(x))?null:n.call(this,x)}}catch(e){}})();</script>",
	}],
};
