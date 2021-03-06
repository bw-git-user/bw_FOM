// 画像検索を行う関数
function photo_search ( param, callback ) {
	if(callback == null || callback == ""){
		callback = "jsonFlickrApiDefault";
	}
	
    // APIリクエストパラメタの設定
    param.api_key  = '131c35f3f542581fb1ca051d5ee09f3e';
    param.method   = 'flickr.photos.search';
    param.sort     = 'date-posted-desc';
    param.format   = 'json';
    param.jsoncallback = callback;

    // APIリクエストURLの生成(GETメソッド)
    var url = 'http://www.flickr.com/services/rest/?'+
               obj2query( param );

    // 前の検索要素を削除しておく
    var script  = document.getElementById("flicker_search");
    if( script != null ){
    	document.body.removeChild(script);
    }
    
    // script 要素の発行
    script = document.createElement( 'script' );
    script.id = "flicker_search"
    script.type = 'text/javascript';
    script.src  = url;
    document.body.appendChild( script );
};

// 現在の表示内容をクリアする
function remove_children ( id ) {
    var div = document.getElementById( id );
    while ( div.firstChild ) { 
        div.removeChild( div.lastChild );
    }
};

// オブジェクトからクエリー文字列を生成する
function obj2query ( obj ) {
    var list = [];
    for( var key in obj ) {
        var k = encodeURIComponent(key);
        var v = encodeURIComponent(obj[key]);
        list[list.length] = k+'='+v;
    }
    var query = list.join( '&' );
    return query;
}

// Flickr検索終了後のコールバック
function jsonFlickrApiDefault ( data ) {
    // データが取得できているかチェック
    if ( ! data ) return;
    if ( ! data.photos ) return;
    var list = data.photos.photo;
    if ( ! list ) return;
    if ( ! list.length ) return;

    // 現在の表示内容（Loading...）をクリアする
    remove_children( 'photos_here' );

    // 各画像を表示する
    var div = document.getElementById( 'photos_here' );
    for( var i=0; i<list.length; i++ ) {
        var photo = list[i];

        // a 要素の生成
        var atag = document.createElement( 'a' );
        atag.href = 'http://www.flickr.com/photos/'+
                    photo.owner+'/'+photo.id+'/';

        // img 要素の生成
        var img = document.createElement( 'img' );
        img.src = 'http://static.flickr.com/'+photo.server+
                  '/'+photo.id+'_'+photo.secret+'_s.jpg';
        img.style.border = '0';
        atag.appendChild( img );
        div.appendChild( atag );
    }
}

function getImgUrl(photo){
    var img = 'http://static.flickr.com/'+photo.server
            + '/'+photo.id+'_'+photo.secret+'.jpg';
    return img;
}
function getSImgUrl(photo){
    var img = 'http://static.flickr.com/'+photo.server
            + '/'+photo.id+'_'+photo.secret+'_s.jpg';
	return img;
}
function getFLinkUrl(photo){
    var ilnk = 'http://www.flickr.com/photos/'
    		 + photo.owner+'/'+photo.id+'/';
	return ilnk;
}

var LDRate = 0.00000268;

// 地図上の距離から表示上の長さを取得
function getLengthFromDistance(distance, zoomlv){
	return distance / ( LDRate * Math.pow(2, (19-zoomlv)) );
}

// 表示上の長さから地図上の距離を取得
function getDistanceFromLength(length, zoomlv){
	return length * ( LDRate * Math.pow(2, (19-zoomlv)) );
}

// 緯度の差を求める
function subLat(lat1, lat2){
	var lath = lat1 + 90;
	var latl = lat2 + 90;
	if( lath < latl ){
		return (latl - lath);
	}
	return (lath - latl);
}

// 経度の差を求める
function subLng(lng1, lng2){
	var lngh = lng1 + 180;
	var lngl = lng2 + 180;
	if( lngh < lngl ){
		return (lngl - lngh);
	}
	return (lngh - lngl);
}

	
// 領域内を判定
function isInBound(photo){
	if(bound == null){
		return true;
	}
	
	var count = 0;
	for(var i = 0; i < bound.getVertexCount()-1; i++){
		var plng = photo.longitude + 180;
		var plat = photo.latitude + 90;
		var v0lng = bound.getVertex(i).lng() + 180;
		var v0lat = bound.getVertex(i).lat() + 90;
		var v1lng = bound.getVertex(i+1).lng() + 180;
		var v1lat = bound.getVertex(i+1).lat() + 90;
		
		if( ( ( (plng - v0lng) * (plng - v1lng) ) < 0 )
		    &&
			( ( (plng - v0lng) * (
								   ( (plng - v0lng) * (v1lat - v0lat) )
								   - 
				  				   ( (plat - v0lat) * (v1lng - v0lng) ) 
			                     )
			  ) < 0 ) 
		  )
		{
			count++;
		} 
	}
	
	if(count % 2 == 0){
		return false;
	}
	return true;
}

// 近いと判断する距離
var NEAR_AREA_X = 18;
var NEAR_AREA_Y = 20;

// 近くのデータのインデックスリストを取得
function getNearData(zoomlv, photo, adata){
	var anear = new Array();
	var anearlen = new Array();

	// 近い場所のインデックスを収集
	var num = getNearLength(zoomlv, photo, adata, anear, anearlen);
	
	if(num == 0){
		return null;
	}
	
	// 逆検索
	num = 0;
	var arnear = new Array();
	arnear.length = 0;
	for(var k = 0; k < anear.length; k++){
		// グループ候補に近い場所のデータを収集
		var anearnear = new Array();
		var anearnearlen = new Array();
		if( getNearLength(zoomlv, adata[ anear[k] ], adata, anearnear, anearnearlen) == 0 ){
			arnear.push(anear[k]);
			num++;
			continue;
		}
		
		// 基準より近いデータがグループ外にあればグループから外す
		var isnear = true;
		for(var m = 0; m < anearnear.length; m++){
			if(photo == adata[ anearnear[m] ]){
				continue;
			}
			
			// グループ内判定
			var isgroup = false;
			for(var n = 0; n < anear.length; n++){
				if(anear[n] == anearnear[m]){
					isgroup = true;
					break;
				}
			}
			if(isgroup){
				continue;
			}
			
			// グループ外のデータとの距離を判定
			if(anearnearlen[m] < anearlen[k]){
				isnear = false;
				break;
			}
		}
		if(isnear){
			arnear.push(anear[k]);
			num++;
		}
	}
	
	if(num == 0){
		return null;
	}
	return arnear;
}

// 近い場所のインデックスと距離を収集
function getNearLength(zoomlv, photo, adata, anear, anearlen){
	var ret = 0;
	anear.length = 0;
	anearlen.length = 0;
	
	// 近い場所のインデックスを収集
	for(var j = 0; j < adata.length; j++){
		var target = adata[j];
		if( target == null ){
			continue;
		}else if(target == photo){
			continue;
		}
		
		// 画面上の距離を判定
		var dx = getLengthFromDistance(subLng(photo.longitude, target.longitude), zoomlv);
		var dy = getLengthFromDistance(subLat(photo.latitude, target.latitude), zoomlv);
		if( dx > NEAR_AREA_X || dy > NEAR_AREA_Y ){
			// 遠い
			continue;
//		}else if ( dy > NEAR_AREA_Y ){
			// 検索データは縦方向に並んでいるはず
//			break;
		}
		
		anear.push(j);
		anearlen.push(dx+dy);
		ret++;
	}
	
	return ret;
}
