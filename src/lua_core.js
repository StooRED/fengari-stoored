import {
	FENGARI_AUTHORS,
	FENGARI_COPYRIGHT,
	FENGARI_RELEASE,
	FENGARI_VERSION,
	FENGARI_VERSION_MAJOR,
	FENGARI_VERSION_MINOR,
	FENGARI_VERSION_NUM,
	FENGARI_VERSION_RELEASE,

	luastring_eq,
	luastring_indexOf,
	luastring_of,
	to_jsstring,
	to_luastring,
	to_uristring,

	lua,
	lauxlib,
	lualib
} from 'fengari';

function lua_push(L,data) {
	if(typeof data === "string"){
		lua.lua_pushstring(L,data);
	}else if(typeof  data === "number"){
		lua.lua_pushnumber(L,data);
	}else if(typeof data === "boolean"){
		lua.lua_pushboolean(L,data);
	}
}

function init_functions(L,functions, in_table){
	for (let fun_name in functions){
		let fun = functions[fun_name];
		if(typeof fun === "function"){
			if(in_table){
				lua.lua_pushstring(L, fun_name);
			}
			lua.lua_pushcfunction(L, function(L){
				//console.log(lua.lua_tostring(L,1));
				let x = 1;
				let args = [];
				while(lua.lua_tojsstring(L,x)){
					args.push(lua.lua_tojsstring(L,x));
					x++;
				}
				const result = functions[fun_name](...args);
				if(Array.isArray(result)){
					for (let i = 0; i < result.length; i++) {
						lua_push(L,result[i]);
					}
					return result.length;
				}else if(result !== undefined){
					lua_push(L, result);
				}else{
					return 0;
				}

			});
			if(in_table){
				lua.lua_settable(L,-3);
			}else{
				lua.lua_setglobal(L, fun_name);
			}

		}else{
			if(in_table){
				lua.lua_newtable(L);
				init_functions(L,functions[fun_name],true);
				lua.lua_settable( L, -3 );
			}else{
				lua.lua_newtable(L);
				init_functions(L,functions[fun_name],true);
				lua.lua_setglobal( L, fun_name );
			}
		}

	}
}

const Lua = {
	"run" : (code,results,args,functions) => {
		const L = lauxlib.luaL_newstate();

		//lualib.luaL_openlibs(L);
		for(let arg_name in args){
			lua.lua_pushstring(L, args[arg_name]);
			lua.lua_setglobal(L, arg_name);
		}

		init_functions(L, functions, false);

		lauxlib.luaL_loadstring(L, to_luastring(code));

		if (lua.lua_pcall(L, 0, results, 0) !== 0){
			return {success: false, result: lua.lua_tojsstring(L, -1)};
		}else{
			let lua_result = [];
			for (let i = 0; i < results; i++) {
				const num = -1 - i;
				lua_result.push(lua.lua_tojsstring(L, num) || lua.lua_toboolean(L, num) || lua.lua_tonumber);
			}
			return {success: true, results: lua_result};
		}
	}
};

export default  Lua;