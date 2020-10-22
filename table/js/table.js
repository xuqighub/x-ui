!function (window) {
    class Table {
        constructor({
            mountEl,
            columns,
            dataSource = {},
            pagination = {
                pageSize: 10
            },
            scroll = {},
            rowSelect = {
                type: 'checkbox'
            },
            loading,
            fillRows = false,
        }) {
            //给para一个默认值
            dataSource.para = {},
            //挂载的目标元素
            this.mountEl = document.querySelector(mountEl);
            //数据字段格式
            this.columns = columns;

            //dataSource是一个对象，里面type字段指明哪种数据方式，
            //获取数据方式，1.通过ajax获取，2.手动传入数据数组
            this.dataList = [];
            //pagination是否需要pagination，如果没有这个字段则不显示pagination，否则显示
            this.pagination = pagination;
            this.dataSource = dataSource;
            if (dataSource.data) {
                this.dataList = dataSource.data;
            }
            //是否存在hasScrollBar
            this.hasScrollbar = false;
            //排序对象，包括排序字段和排序方式
            this.sort = {};

            //这个字段就是看是否需要有下拉滚动条,包含x,y属性{x:1500,y:800}
            //有没有传入单位，没有传入单位默px为单位
            let unitReg = /px|vw|vh|\%|rem/;
            scroll.x = scroll.x ? (unitReg.test(scroll.x) ? scroll.x : scroll.x + 'px') : undefined;
            scroll.y = scroll.y ? (unitReg.test(scroll.y) ? scroll.y : scroll.y + 'px') : undefined;
            this.scroll = scroll;
            //checkbox 或者 radio 类型
            this.rowSelect = rowSelect;
            //table 表体部分数据没满的是否需要空行填满，好看一点
            this.fillRows = fillRows;

            this.loading = loading;

            this.loadingCompnent = null;

            //初次渲染数据表格
            this.renderTable();
        }

        //初始化表格结构
        _initStruct = () => {
            let {
                columns,
                scroll: {
                    x: scrollX,
                    y: scrollY
                },
            } = this;

            //是否有 fixed 到左边或者有右边的列
            let hasFixedColumn = columns.some(column => column.fixed);
            //表格布局方式
            let tableLayout = hasFixedColumn || scrollX ? 'fixed' : 'auto';

            /*下面生成ui-table-header中加了17 是因为头部的table由于没有垂直滚动条多的一个向右滚动的箭头（17px)，
             **会导致滚动的时候body部分的scrollLeft比上面多17px,(上面head的scrollLeft已经最大值)，所以需要在width中加上大于17px就行
             */
            //下面table都默认渲染了一次tableheader,防止数据请求失败不能更新表头，tbody默认有个tr，防止没有数据不出现滚动条
            return `
                <div class="ui-table-container ${scrollX ? 'ui-table-ping-right' : ''}">
                    <div class="ui-table-content">
                        ${ scrollY 
                            ? (
                                `
                                <div class="ui-table-header">
                                    <table class="ui-table" style = "${ (scrollX ? ('width:' + (parseInt(scrollX)+17) + 'px;') : '') }"> 
                                        ${ this._createColgroup()[0] + this.createThead() } 
                                    </table>
                                </div>
                                <div class="ui-table-body" style = "${ scrollY ? ('height:'+ scrollY + ';') : ''}" >
                                    <table class="ui-table" style = "min-width:100%; ${ (scrollX ? ('width:' + scrollX + ';') : '') }"> 
                                        ${ this._createColgroup()[1] } 
                                        <tbody class="ui-table-tbody"><tr></tr></tbody>
                                    </table>
                                </div>
                                `
                            )
                            :
                            (`<table class="ui-table" style = "min-width:100%; ${ (scrollX ? ('width:' + scrollX + ';') : '') } table-layout:${tableLayout}">
                                    ${this._createColgroup()[1] + this.createThead()}
                                <tbody class="ui-table-tbody"><tr></tr></tbody>
                            </table>`)
                        }
                    </div>
                </div>
            `;
        }

        //生成colgroup
        _createColgroup =()=>{
            let {
                columns,
                _createHeadcolGroup,
                hasScrollbar
            } = this;
            let col = columns.map(item => {
                //如果拥有rowSelect,则默认有个宽度
                if (item.rowSelect) {
                    item.width = item.width ? item.width : 60;
                }
                return `<col ${item.width ? 'style=width:'+item.width + 'px;min-width:'+item.width+'px;' :''} />`;
            }).join('');

            //即给出的宽度大于了item加起来的宽度,是否需要重新计算colgroup里面的数值
            let createHeadcolGroup = _createHeadcolGroup();
            //返回一个数组，第一个是table-head如果需要的拥有hasScrollBar的计算宽度的 col,两个table表示
            //第二个是table-body的宽度规范,没有用两个table分别表示表头标体
            return [
                createHeadcolGroup 
                ? createHeadcolGroup 
                : `<colgroup>${ col + (hasScrollbar ? '<col style="width:17px;min-width:17px;" />' : '')}</colgroup>`
                ,`<colgroup>${ col }</colgroup>`
            ];
        }
        
        //创建table需要的thead
        createThead = ()=>{
            let {
                columns,
                scroll: {
                    x: scrollX,
                },
                hasScrollbar
            } = this;
            let _this = this;

           
            //生成排序上下箭头html结构
            function sorter(textContent) {
                return `<div class="ui-table-column-sorters">
                    <span>${textContent}</span>
                    <span class="ui-table-column-sorter">
                        <span title="升序" class="ui-table-column-sorter-up"></span>
                        <span title="降序" class="ui-table-column-sorter-down"></span>
                    </span>
                </div>`;
            }
            //thead
            let thead = function () {
                let th = columns.map((item, index, columnsArr) => {
                    //内容
                    let textContent = item.title;
                    //处理过后的内容
                    let renderContent = item.rowSelect ? _this.rowSelectEl(false,true) : textContent;
                    //有fixed属性固定列的处理
                    if (item.fixed === 'left') {
                        let left = 0;
                        for (let i = 0; i < index; i++) {
                            //如果前面的字段没有fixed则不累加
                            if (!columnsArr[i].fixed) continue;
                            //对前面存在fixed并且为left的width进行累加
                            left += columnsArr[i].width ? columnsArr[i].width : 0;
                        }
                        return `<th 
                        data-field = ${item.dataIndex  /*增加列上的filed属性*/} 
                        ${_this.sort?.field === item.dataIndex ? 'data-sort-type='+ _this?.sort?.type :'' /*给排序列增加属性 */}
                        ${item.ellipsis ? 'title=' + textContent : ''}
                        class="ui-table-cell ui-table-fix-left 
                        ${item.sort ? 'ui-table-column-has-sorters' : '' /*是否是拥有排序的一列*/}
                        ${item.ellipsis ? 'ui-table-cell-ellipsis' : ''} 
                        ${columnsArr[index + 1].fixed !== 'left' ? 'ui-table-fix-left-last' : ''}
                        ${item.rowSelect ? 'ui-table-selection-column' : ''}"
                        style="left:${left}px;"
                        >${item.sort ? sorter(renderContent) : renderContent /*是否有sort字段*/}</th>`;
                    } else if (item.fixed === 'right') {
                        let right = 0;
                        for (let i = columnsArr.length - 1; i > index; i--) {
                            //如果前面的字段没有fixed则不累加
                            if (!columnsArr[i].fixed) continue;
                            //对前面存在fixed并且为right的width进行累加，如果有height方向的滚动条，每一个fixed:right的元素都要加上一个scrollbar的宽度
                            right += columnsArr[i].width ? columnsArr[i].width + (hasScrollbar ? 17 : 0) : 0;
                        }
                        //这里有个17px，是根据数据量计算是否需要滚动条然后补足右边的
                        return `<th 
                        data-field = ${item.dataIndex  /*增加列上的filed属性*/} 
                        ${_this.sort?.field === item.dataIndex ? 'data-sort-type='+ _this?.sort?.type :'' /*给排序列增加属性 */}
                        ${item.ellipsis ? 'title=' + textContent : ''}
                        class="ui-table-cell  ui-table-fix-right 
                        ${item.sort ? 'ui-table-column-has-sorters' : '' /*是否是拥有排序的一列*/}
                        ${item.ellipsis ? 'ui-table-cell-ellipsis' : ''} 
                        ${columnsArr[index - 1].fixed !== 'right'? 'ui-table-fix-left-first' : ''}
                        ${item.rowSelect ? 'ui-table-selection-column' : ''}" 
                        style="right:${right === 0 && hasScrollbar ? '17' : right}px;"
                        >${item.sort ? sorter(renderContent) : renderContent /*是否有sort字段*/}</th>`;
                    }
                    //没有fixed固定属性
                    return `<th
                    data-field = ${item.dataIndex  /*增加列上的filed属性*/} 
                    ${_this.sort?.field === item.dataIndex ? 'data-sort-type='+ _this?.sort?.type :'' /*给排序列增加属性 */}
                    ${item.ellipsis ? 'title=' + textContent : '' /*给超出宽度 ellipse 的列增加title字段*/} 
                    class="ui-table-cell 
                    ${item.sort ? 'ui-table-column-has-sorters' : '' /*是否是拥有排序的一列*/}
                    ${item.ellipsis ? 'ui-table-cell-ellipsis' : '' /*是否是超出宽度ellipsis列*/}
                    ${item.rowSelect ? 'ui-table-selection-column' : '' /*是否是拥有选择项的一列*/}"
                    >${item.sort ? sorter(renderContent) : renderContent /*是否有sort字段*/}</th>`;
                }).join('');

                //有checkbox或者radio选项时增加一列
                return `<thead class="ui-table-thead">
                        <tr>${th + (hasScrollbar ? '<th class="ui-table-scrollbar ui-table-fix-right" style="right:0"></th>' : '')}</tr>
                    </thead>`;
            }

            return thead();
        }

        //填充表头
        renderTableHeader = ()=>{
            let {
                scroll: {
                    y: scrollY
                },
                mountEl
            } = this;
            let tableHeader = (`<table class="ui-table" style = "${ (scrollX ? ('width:' + (parseInt(scrollX)+17) + 'px;') : '') }"> 
                ${ this._createColgroup()[0] + this.createThead() } 
            </table>`);
            if(scrollY){
                //如果有scrollY,即表体高度
                mountEl.querySelector('.ui-table-header').innerHTML = tableHeader;
            }else{
                //没有scrollY
                let thead = mountEl.querySelector('.ui-table thead');
                let colgroup = mountEl.querySelector('.ui-table colgroup');
                mountEl.querySelector('.ui-table').removeChild(thead);
                mountEl.querySelector('.ui-table').removeChild(colgroup);
                let temp = document.createElement('table');
                temp.innerHTML = this._createColgroup()[1] + this.createThead();
                let fragment = document.createDocumentFragment();
                while(temp.firstElementChild){
                    fragment.appendChild(temp.firstElementChild);
                }
                mountEl.querySelector('.ui-table').appendChild(fragment);
            }
        }

        //根据数据生成的trs
        dataToTrs = (dataList) => {
            let {
                columns,
            } = this;
            let _this = this;
            //根据column状态确定该行radio或者checkbox是否是选择状态
            function checkedStatus(column,item){
                //如果有render方法，则优先使用render方法返回的结果
                if(typeof column.render === 'function'){
                    let status = column.render(item[column.dataIndex], item);
                    return _this.rowSelectEl(status);
                }
                //当column里面不仅有rowSelect还有dataIndex时，表明数据中自带checkbox字段按数据的checked状态渲染
                return _this.rowSelectEl(item[column.dataIndex]);
            }
            //过滤标签正则
            var re = /<[^<>]+>/g;

            let trs = dataList.map((item,dataIndex) => {
                let td = columns.map((column, index, columnsArr) => {
                    //在td里面呈现的内容
                    let renderContent = column.rowSelect 
                    ? checkedStatus(column,item) 
                    : (typeof column.render === 'function' ? column.render(item[column.dataIndex], item) : item[column.dataIndex]);
                    //当为可编辑单元格时，需要增加一层div
                    renderContent = column.edit ? `<div data-field=${column.dataIndex} class="ui-table-cell-edit-value">${renderContent}</div>` : renderContent;
                    //过滤掉标签，title显示的内容
                    let titleContent = column.ellipsis ? renderContent.replace(re, '') : '';
                    //有fixed属性固定列的处理
                    if (column.fixed === 'left') {
                        let left = 0;
                        for (let i = 0; i < index; i++) {
                            //如果前面的字段没有fixed则不累加
                            if (!columnsArr[i].fixed) continue;
                            //对前面存在fixed并且为left的width进行累加
                            left += columnsArr[i].width ? columnsArr[i].width : 0;
                        }
                        //ui-table-cell-ellipsis，是否有ellipsis属性，超出...
                        return `<td 
                                ${column.ellipsis ? `title="${titleContent}"` : ''}
                                class="ui-table-cell ui-table-fix-left ${column.ellipsis ? 'ui-table-cell-ellipsis' : ''} ${columnsArr[index + 1].fixed !== 'left' ? 'ui-table-fix-left-last' : ''}
                                ${column.rowSelect ? 'ui-table-selection-column' : ''}" 
                                style="left:${left}px;"
                                >${renderContent}</td>`;
                    } else if (column.fixed === 'right') {
                        let right = 0;
                        for (let i = columnsArr.length - 1; i > index; i--) {
                            //如果前面的字段没有fixed则不累加
                            if (!columnsArr[i].fixed) continue;
                            console.log(columnsArr[i], columnsArr[i].width);
                            //对前面存在fixed并且为left的width进行累加
                            right += columnsArr[i].width ? columnsArr[i].width : 0;
                        }
                        return `<td 
                                ${column.ellipsis ? `title="${titleContent}"` : ''}
                                class="ui-table-cell ui-table-fix-right ${column.ellipsis ? 'ui-table-cell-ellipsis' : ''} ${columnsArr[index - 1].fixed !== 'right' ? 'ui-table-fix-left-first' : ''}
                                ${column.rowSelect ? 'ui-table-selection-column' : ''}" 
                                style="right:${right}px;"
                                >${renderContent}</td>`;
                    }
                    //没有fixed固定属性
                    return `<td data-value="${item[column.dataIndex]}"
                                ${column.ellipsis ? `title="${titleContent}"` : ''}
                                class="ui-table-cell 
                                ${column.edit ? 'ui-table-cell-edit' : '' /* 可编辑单元格*/}
                                ${column.ellipsis ? 'ui-table-cell-ellipsis' : '' /* 超出...*/} 
                                ${column.rowSelect ? 'ui-table-selection-column' : '' /* 可选择单元格*/}"
                            >${renderContent}</td>`;
                }).join('');

                return `<tr data-index=${dataIndex}>${td}</tr>`;
            }).join('');

            trs = this.fillRows ? trs + this._fillRows(columns,dataList) : trs;
            
            //没有数据的时候返回一个<tr></tr>,避免没有数据，表头不能滚动
            return trs ? trs : '<tr></tr>';
        }

        //初次渲染表格
        renderTable = () => {
            //初始化表格结构
            let _initStruct = this._initStruct();
            let _this = this;
            let {
                pagination,
                mountEl,
                dataList,
                dataSource,
                loading={size:'middle'}
            } = this;
            mountEl.innerHTML = _initStruct;
            //初始化关于table的事件
            this.eventInit();
            //如果loading存在,直接传入false则不需要loading
            if(loading){
                this.loadingCompnent = window.loading.render(mountEl,loading.size);
            }

            //如果传入pagination:false则不渲染pagination组件
            if (pagination) {
                //创建pagination实例
                this.createPagination();
                /*第一次请求需要将curPage设为1，pageSize设为10默认,将这两个字段加入请求数据的参数中
                 **根据pagination里面是否有para来确定是否需要自定义向后端请求数据的当前页和每页大小的字段*/
                dataSource.para[pagination ?. para ?.curPage ?? 'curPage'] = 1;
                dataSource.para[pagination ?. para ?.pageSize ?? 'pageSize'] = pagination.pageSize;
            }

            //具有data，不需要请求数据
            if (dataSource.data) {
                //缓存排序前的数据列表
                this.oldDataList = dataList;
                if(pagination){
                    //具有pagination渲染第一页数据
                    this.updateTable(dataList.slice(0, 1*pagination.pageSize));
                }else{
                    //没有pagination渲染所有数据
                    this.updateTable(dataList);
                }
                return;
            }

            //如果存在url,没有data,需要请求数据首次渲染表格
            if (dataSource.url) {
                let {
                    parseData
                } = dataSource;
                //获取数据
                _this._getData(dataSource)
                    .then(res => {
                        //将返回结果经过处理之后返回一个数据对象,例如{data:[...],code:'200',count:200}
                        res = parseData ? parseData(res) : res;
                        //记录当前页的数据列表
                        _this.dataList = res.data;
                        //更新表格数据
                        _this.updateTable(res.data);
                        //更新pagination的总条数
                        if (res.count && pagination) {
                            _this.paginationObj.update({
                                count: res.count,
                                curPage: 1
                            })
                        }
                    });
            }
            
        }

        //创建pagination实例
        createPagination = () => {
            let _this = this;
            let {
                pagination,
                dataList,
                dataSource
            } = this;

            //创建一个包含pagination组件的box，并挂载到table盒子中
            let paginationBox = document.createElement('div');
            paginationBox.className = 'pagination-container';
            this.mountEl.appendChild(paginationBox);
            //初始化pagination
            this.paginationObj = window.pagination.render({
                mountEl: '.pagination-container',
                count: dataList.length || 0,
                groups: 5,
                curPage: 1,
                pageSize: 10,
                prev: '上一页',
                layout: ['count', 'prev', 'page', 'next', 'limits', 'refresh', 'skip'],
                next: '下一页',
                ...pagination,
                callback: _this.paginationInitCallback(dataSource),
            })

        }
        //pagination上的事件操作后的回调函数，比如获取数据
        paginationInitCallback = (dataSource) => {
            let _this = this;
            let {
                pagination,
                loadingCompnent
            } = this;
            return function (paginationInfo) {
                //obj包含当前分页的所有参数，比如obj.curPage,obj.pagiSize
                // console.log(paginationInfo, 'paginationCallbackpaginationInfo');
                /*重置向后端请求的当前页和每页大小跟pagination组件关联,根据pagination里面是否有para来确定是否需要自定义
                 *向后端请求数据的当前页和每页大小的字段*/
                // if(pagination.para){
                //     pagination.para.curPage && (dataSource.para[pagination.para.curPage] = paginationInfo.curPage);
                //     pagination.para.pageSize && (dataSource.para[pagination.para.pageSize] = paginationInfo.pageSize);
                // }else{
                //     dataSource.para.curPage = paginationInfo.curPage;
                //     dataSource.para.pageSize = paginationInfo.pageSize;
                // }
                dataSource.para[pagination ?. para ?. curPage ?? 'curPage'] = paginationInfo.curPage;
                dataSource.para[pagination ?. para ?. pageSize ?? 'pageSize'] = paginationInfo.pageSize;
                //如果是dataSource中的data属性存在则优先在dataSource中获取数据源
                if (dataSource.data) {
                    //根据页码跟新数据内容
                    _this.updateTable(_this.dataList.slice((paginationInfo.curPage - 1) * paginationInfo.pageSize, paginationInfo.curPage * paginationInfo.pageSize));
                    return;
                }
                //如果存在url,
                if (dataSource.url) {
                    //显示loading层
                    if(_this.loading){
                        _this.showLoading();
                    }
                    //获取数据
                    _this._getData(dataSource)
                        .then(res => {
                            let {
                                parseData
                            } = dataSource;
                            //隐藏loading层
                            if(_this.loading){
                                _this.hideLoading();
                            }
                            //将返回结果经过处理之后返回一个数据对象,例如{data:[...],code:'200',count:200}
                            res = parseData ? parseData(res) : res;
                            //记录当前页的数据列表
                            _this.dataList = res.data;
                            //更新表格数据
                            _this.updateTable(res.data);
                            //更新pagination的总条数
                            if (res.count) {
                                _this.paginationObj.update({
                                    count: res.count,
                                })
                            }
                        });
                }
            }
        }

        //强制更新table的数据，然后重新渲染，比如点击分页之后渲染新的数据
        updateTable = (dataList) => {
            // console.log(dataList);
            let {
                mountEl,
            } = this;
            dataList = dataList ? dataList : this.dataList;
            mountEl.querySelector('.ui-table-tbody').innerHTML = this.dataToTrs(dataList);

            //因为需要数据填充完毕之后才知道实际高度，所以header重新渲染需要在填充数据之后
            this.hasScrollbar = this._hasScrollbar(dataList.length);
            //更新表头
            this.renderTableHeader();
        }

        /*这个更新是通过table对象更新数据，比如搜索数据之类的，不仅需要更新表格数据，还要将pagination的curpage设为第一页
         **传入的参数是dataSource,会在初始dataSource的基础上添加或者覆盖之前的数据，并且只是暂时的，不会干扰基础的dataSource
         **例如现在要多传入一个age:18,前调用table的时候传了一个name:leo那么只需要传入{para:{age:18}},url和parseDate可以
         **传也可以不传，传了就会覆盖
         */
        update = (updateDataSource={},isInnerUpdate) => {
            let {
                pagination,
                dataSource
            } = this;
            let _this = this;
            //计算当前页是多少
            let curPage = (isInnerUpdate && _this?.paginationObj?.getStatus()?.curPage) ?? 1;
            //对datasource参数进行更新合并，不干扰初始的dataSource
            dataSource = {
                ...dataSource,
                ...updateDataSource,
                //isInnerUpdate是表示是否是内部调用这个方法，如果是，则沿用之前的data
                data: updateDataSource.data || isInnerUpdate ? (updateDataSource?.data ?? dataSource.data) : null,
                para: {
                    ...dataSource.para,
                    ...updateDataSource.para,
                    //请求的curPage是否被其他字段替代掉, 内部调用则还是之前请求的页码
                    [pagination ?. para ?. curPage ?? 'curPage']:curPage,
                },
            }
            //直接给出的数据数组
            if (dataSource.data) {
                this.dataList = dataSource.data;
                //如果传入了新的data,则覆盖之前的缓存的dataList
                if(isInnerUpdate && updateDataSource.data){
                    this.oldDataList = this.dataList;
                }
                if(this.sort.type){
                    //有sort.type属性则对数据进行排序
                    this.dataList = _this._sortData(this.dataList,this.sort.type,this.sort.field);
                }else{
                    //当点击到没有排序的时候需要原来的数据
                    this.dataList = this.oldDataList || this.dataList;
                }
                //有页码根据页码分页显示
                if (pagination) {
                    let pageSize = (isInnerUpdate && _this?.paginationObj?.getStatus()?.pageSize) ?? this.pagination.pageSize;
                    //根据页码更新数据内容,有页码就分页显示
                    this.updateTable(this.dataList.slice((curPage-1) * pageSize, curPage * pageSize));
                    //更新pagination的当前页重置为1，更新count。更新点击事件的回调函数,如果是内部调用则不更新页码
                    if(!isInnerUpdate){
                        this.paginationObj.update({
                            curPage: 1,
                            count: this.dataList.length
                        }, function (obj) {
                            _this.updateTable(_this.dataList.slice((obj.curPage - 1) * obj.pageSize, obj.curPage * obj.pageSize));
                        })
                    }
                } else {
                    //没有页码就全部一页显示完所有数据data
                    this.updateTable(this.dataList);
                }
                return;
            }
            //如果存在url,并且没有数据数组
            if (dataSource.url) {
                let {
                    parseData
                } = dataSource;
                if(this.sort.type){
                    console.log(this.sort,'sss')
                    //如果存在这个字段的排序，则将排序字段放入请求数据的参数中
                    dataSource.para[dataSource ?. sort ?. order ?? 'order'] = this.sort.type;
                    dataSource.para[dataSource ?. sort ?. sort ?? 'sort'] = this.sort.field;
                }else{
                    //如果没有排序了，则删除之前可能存在的请求参数中的排序字段
                    delete dataSource.para[dataSource ?. sort ?. order ?? 'order'];
                    delete dataSource.para[dataSource ?. sort ?. sort ?? 'sort'];
                }
                //显示loading层
                if(_this.loading){
                    _this.showLoading();
                }
                //请求数据更新表格数据
                this._getData(dataSource)
                    .then(res => {
                        //显示loading层
                        if(_this.loading){
                            _this.hideLoading();
                        }
                        //将返回结果经过处理之后返回一个数据对象,例如{data:[...],code:'200',count:200}
                        res = parseData ? parseData(res) : res;
                        //记录当前页的数据列表
                        _this.dataList = res.data;
                        //更新表格数据
                        _this.updateTable(res.data);
                        //更新pagination的总条数,如果是内部调用（排序）则不更新当前页码，回调函数里的dataSource必须变化（加了参数）
                        if (res.count && pagination) {
                            _this.paginationObj.update({
                                count: res.count,
                                //如果当前update方法是内部调用，则当前页不变
                                curPage: isInnerUpdate ? '' : 1,
                            }, _this.paginationInitCallback(dataSource))
                        }
                    });
            }

        }

        //通过url获取数据
        _getData = ({
            url,
            para,
            contentType
        }) => {
            console.log(para, 'para')
            if (!url) throw Error('the url is required');
            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();

                //处理请求数据时传入的参数
                let formData = null;
                if (contentType) {
                    formData = JSON.stringify(para);
                    xhr.setRequestHeader('Content-Type', contentType);
                } else {
                    formData = new FormData();
                    for (let [key, value] of Object.entries(para)) {
                        if (value) {
                            formData.append(key, value);
                        }
                    }
                }

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                            var response = typeof xhr.response === 'string' ? JSON.parse(xhr.response) : xhr.response;
                            resolve(response);
                        } else {
                            reject(xhr.response);
                        }
                    }
                }
                xhr.open("POST", url, true);
                xhr.send(formData);
            });


        }
        //对数据进行排序
        _sortData = (dataList,sortType,field)=>{
            //拷贝一份数据
            dataList = dataList.slice(0);
            //判断是否含有非数字
            let isNumber = dataList.some(item=>{
                return isNaN(field ? item[field] : item);
            });
            if(sortType === 'asc'){
                //升序
                if(!isNumber){
                    //数字排序
                    dataList.sort((dataA,dataB)=>{
                        return (field 
                            ? +dataA[field] - +dataB[field]
                            : +dataA - +dataB);
                    });
                }else{
                    //非数字排序
                    dataList.sort((dataA,dataB)=>{
                        return (field
                            ? dataA[field].localeCompare(dataB[File])
                            : dataA.localeCompare(dataB));
                    })
                }
            }else if(sortType === 'desc'){
                //降序
                //升序
                if(!isNumber){
                    //数字排序
                    dataList.sort((dataA,dataB)=>{
                        return (field 
                            ? +dataB[field] - +dataA[field]
                            : +dataB - +dataA);
                    });
                }else{
                    //非数字排序
                    dataList.sort((dataA,dataB)=>{
                        return (field
                            ? dataB[field].localeCompare(dataA[File])
                            : dataB.localeCompare(dataA));
                    })
                }
            }
            return dataList;
        }

        //第一行是否出现checkbox或者radio，多选或者单选列
        rowSelectEl = (checked = false,isHeader=false)=> {
            let {
                rowSelect,
            } = this;
            let disabled = false;
            if(checked === 'false'){
                checked = false;
            }
            //如果checked=== disabled，则表明该选项时不可选中的元素
            if(checked === 'disabled'){
                checked = false;
                disabled = true;
            }
            if (rowSelect.type === 'radio') {
                //是否是表头，表头不需要呈现radio
                return isHeader ? '' : `<label><input name="radio-group" class="ui-table-checkinput ui-table-radio" type="radio" /></label>`;
            }
            //默认返回的是checkbox
            if (rowSelect.type === 'checkbox') {
                //如果是表头，则需要添加ui-table-checkedboxAll类
                return isHeader 
                ? `<label><input  class="ui-table-checkinput ui-table-checkbox ui-table-checkedboxAll" type="checkbox" /></label>`
                : `<label ${disabled ? 'class="ui-table-disabled"':''}><input ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} class="ui-table-checkinput ui-table-checkbox ${disabled ? 'ui-table-disabled':''}" type="checkbox" /></label>`;
            }
        };

        //初始化table相关事件
        eventInit = () => {

            let {
                columns,
                scroll: {
                    x: scrollX,
                    y: scrollY
                }
            } = this;
            let _this = this;

            //获取fixed：left 和 fixed:right 第一个元素的距离左右边的width
            function getFixedColumWidth() {
                let leftWidth = 0;
                let rightWidth = 0;
                //找到第一个fixed 为 left 的width
                for (let i = 0; i < columns.length; i++) {
                    if (columns[i].fixed === 'left') {
                        break;
                    }
                    //如果遍历到最后一个元素了，则表示没有fixed:left，返回false
                    if (i === columns.length - 1) {
                        leftWidth = NaN;
                        break;
                    }
                    leftWidth += columns[i].width ? +columns[i].width : 0;
                }
                //找到第一个fixed 为 right 的 width
                for (let i = columns.length - 1; i >= 0; i--) {
                    if (columns[i].fixed === 'right') {
                        break;
                    }
                    //如果遍历到第一个元素了，则表示没有fixed:right，返回false
                    if (i === 0) {
                        rightWidth = NaN;
                        break;
                    }
                    rightWidth += columns[i].width ? +columns[i].width : 0;
                }
                return [leftWidth >= 0 ? leftWidth : null, rightWidth >= 0 ? rightWidth : null];
            }
            //滚动条
            (function scroll() {
                //有左右滚动条的包含table的包裹元素,
                let bodyScrollEl = _this.mountEl.querySelector('.ui-table-body') ||
                    _this.mountEl.querySelector('.ui-table-content');
                //overflow为hiddend的包含talbe的包裹元素
                let headScrollEl = _this.mountEl.querySelector('.ui-table-header');
                //当有滚定列时，左右滚动时可以添加类名显示阴影边的上层container元素
                let tableContainer = _this.mountEl.querySelector('.ui-table-container');
                //scrollAll是scroll的包含table体元素的除去元素宽度的 滚动距离
                let scrollLeftAll = bodyScrollEl.scrollWidth - bodyScrollEl.offsetWidth;
                //为了让滚动条滚动时不要多次执行不必要的操作，提升性能
                let switchFlag = {
                    leftWidthWrok: false,
                    rightWidthWork: false,
                };
                let [leftWidth, rightWidth] = getFixedColumWidth();
                bodyScrollEl.onscroll = (ev) => {

                    let scrollLeft = bodyScrollEl.scrollLeft;

                    if (scrollY) {
                        //当有头部固定有滚动条的时候，表体滚动时表头跟着滚动
                        headScrollEl.scrollLeft = scrollLeft;
                    }

                    //当左边第一个固定列的sticy生效的时候加一个阴影边
                    if (scrollLeft > leftWidth) {
                        //flag为还未执行过
                        if (!switchFlag.leftWidthWrok) {
                            switchFlag.leftWidthWrok = true;
                            tableContainer.classList.add('ui-table-ping-left');
                        }
                    } else {
                        //左边第一个固定列还原回没有sticy生效的位置，并且只执行一次
                        if (switchFlag.leftWidthWrok) {
                            switchFlag.leftWidthWrok = false;
                            tableContainer.classList.remove('ui-table-ping-left');
                        }
                    }

                    //当右边第一个固定列的sticy生效的时候加一个阴影边
                    if (scrollLeftAll - scrollLeft <= rightWidth) {
                        //flag为还未执行过
                        if (!switchFlag.rightWidthWork) {
                            switchFlag.rightWidthWork = true;
                            tableContainer.classList.remove('ui-table-ping-right');
                        }
                    } else {
                        //左边第一个固定列还原回没有sticy生效的位置，并且只执行一次
                        if (switchFlag.rightWidthWork) {
                            switchFlag.rightWidthWork = false;
                            tableContainer.classList.add('ui-table-ping-right');
                        }
                    }
                }
            })();
            //点击排序
            (function sortClick(){
                _this.mountEl.onclick = function(ev){
                    let target = ev.target;
                    //找到目标target
                    while(target && target.nodeName.toUpperCase() !== 'TABLE'){
                        if(target?.classList?.contains('ui-table-column-has-sorters')){
                            break;
                        }
                        target = target.parentNode;
                    }
                    //确定点击的是排序按钮
                    if(target?.classList?.contains('ui-table-column-has-sorters')){
                        target.classList.add('ui-table-sorter-up');
                        //当前排序状态
                        let sortType = target.dataset.sortType;
                        let sortFiled = target.dataset.field;
                        //排序并更新table
                        sort(sortType,sortFiled);
                    }
                }
                //排序并更新table
                function sort(sortType,sortFiled){
                    _this.sort = {
                        field:sortFiled
                    }
                    if(sortType === 'asc'){
                        //当前为升序变为降序
                        _this.sort.type = 'desc';
                    }else if(sortType === 'desc'){
                        //当前为降序变为没有排序
                        _this.sort.type = null;
                    }else{
                        //当前没有排序
                        _this.sort.type = 'asc';
                    }
                    //更新table
                    _this.update({},true);
                }
            })();

            //可编辑行
            (function editTableCell(){
                _this.mountEl.addEventListener('click',function(ev){
                    let target = ev.target;
                    while(target !== this && target){
                        if(target?.classList?.contains('ui-table-cell-edit-value')){
                            break;
                        }
                        target = target.parentNode;
                    }
                    //是否是可编辑单元格
                    if(target?.classList?.contains('ui-table-cell-edit-value')){
                        let td = target.parentNode;
                        let field = target.dataset.field;
                        //根据field找到对应的columnItem的edit值
                        let columnItemEdit = columns.find(item=>item.dataIndex===field).edit;
                        let temp = document.createElement('div');
                        let editEl = null;
                        //单元格的原始值
                        let fieldValue = td.dataset.value;
                        //如果是自定义的编辑框
                        if(columnItemEdit.editEl){
                            temp.innerHTML = columnItemEdit.editEl;
                            editEl = temp.firstElementChild;
                            editEl.classList.add('ui-table-editel');
                        }else{
                            //默认为input 编辑框
                            temp.innerHTML = `<input class="ui-table-edit-input ui-table-editel" />`;
                            editEl = temp.firstElementChild;
                        }
                        //先清空div里面的值，然后再加入编辑元素
                        target.innerHTML= '';
                        target.appendChild(editEl);
                        //将编辑框的值设为该单元格的值
                        editEl.value = fieldValue;
                        //添加元素后，给元素进入焦点状态
                        editEl.focus();
                        //阻止冒泡到document
                        editEl.onclick = function(ev){
                            ev.stopPropagation();
                        }
                        //点击esc或者enter时变回原来的值和调用回调函数（调教数据）
                        //根据返回值确定是否成功
                        document.onkeydown = function(ev){
                            //数据提交成功或失败后调用的回调函数，告诉这个cell是用新值还是旧值
                            function resCallback(result){
                                if(result){
                                    //编辑成功了写入正确的值
                                    //不成功则不更新表格
                                    target.removeChild(editEl);
                                    if(editEl.classList.contains('ui-table-edit-input')){
                                        target.textContent = editEl.value;
                                    }else{
                                        let index = editEl.selectedIndex;
                                        target.textContent = editEl.options[index].text;
                                    }
                                }else{
                                    //不成功则不更新表格
                                    target.removeChild(editEl);
                                    target.textContent = fieldValue;
                                }
                            }
                            if(ev.keyCode === 27){
                                let textNode = document.createTextNode(fieldValue);
                                target.appendChild(textNode);
                                target.removeChild(editEl);
                            }else if(ev.keyCode === 13){
                                //调用该cell编辑的回调函数，传入新值和回调函数
                                columnItemEdit.callback && columnItemEdit.callback(editEl.value,resCallback);
                            }
                        }
                        //失去焦点的时候变回原来的值
                        editEl.onblur = function(){
                            //这里加延迟是因为esc或者enter后触发onblur，移除editel需要时间，不加延时会parenNode会判断为存在
                            setTimeout(_=>{
                                if(editEl.parentNode){
                                    target.removeChild(editEl);
                                    target.innerHTML = fieldValue;
                                }
                            })
                        }
                    }
                })
            })();

            //checkbox选中取消
            (function checkbox(){
                _this.mountEl.onchange = function(ev){
                    //找到是checkbox 的元素
                    if(ev.target.classList.contains('ui-table-checkedboxAll')){
                        //将所有checkbox状态设置为跟头部一样
                        let checkboxs = _this.mountEl.querySelectorAll('.ui-table-checkbox');
                        [...checkboxs].forEach(checkbox=>{
                            //不选中具有disabled属性的checkbox
                            if(!checkbox.disabled){
                                checkbox.checked = ev.target.checked;
                            }
                        })
                    }
                }
            })();
        }

        //获取被选中的dataObj，比如checkbox选中的或者radio选中的
        getCheckedData = ()=>{
            //如果是radio
            if(this.rowSelect.type === 'radio'){
                let radioChecked = this.mountEl.querySelectorAll('.ui-table-radio:checked')[0];
                if(radioChecked){
                    let target = radioChecked.parentNode;
                    while(target.nodeName.toUpperCase() !== 'TR'){
                        target = target.parentNode;
                    }
                    let index = target.dataset.index;
                    return index ? this.getDataObj(index) : [];
                }
            }else{
                //存储选中数据的index
                let indexArr = [];
                //获取所有checked数据行
                let checkboxs = this.mountEl.querySelectorAll('.ui-table-checkbox:checked');
                //找到拥有data-index数据行（取出表头checkbox）,将index存入indexArr
                for(let i=0;i<checkboxs.length;i++){
                    let target = checkboxs[i].parentNode;
                    while(target.nodeName.toUpperCase() !== 'TR'){
                        target = target.parentNode;
                    }
                    let dataIndex = target.dataset.index;
                    dataIndex && indexArr.push(dataIndex);
                }
                //返回index对应的数据对象
                return indexArr.map(item=>{
                    return this.getDataObj(item);
                });
            }
        }
        //根据当前页数据长度判断是否有scrollbar
        _hasScrollbar = ()=>{
            let {
                mountEl,
                scroll: {
                    y: scrollY
                }
            } = this;
            //如果不存在scrollY,没有高度就直接返回false
            if(!scrollY){
                return false;
            }
            //获取table实际高度
            let tbodyHeight = mountEl.querySelector('.ui-table-body table').offsetHeight;
            //获取table的父级的实际高度
            let boxHeight = mountEl.querySelector('.ui-table-body').offsetHeight;
            //判断是否出现滚动条
            let hasScrollBar = tbodyHeight > boxHeight ? true : false;
            return hasScrollBar;
        }
        //tablebody能够容纳的最大的行数
        _maxRowLength = (rowHeight) => {
            let {
                mountEl,
                scroll: {
                    y: scrollY
                }
            } = this;
            let bodyHeight = mountEl.querySelector('.ui-table-body') ? mountEl.querySelector('.ui-table-body').offsetHeight : parseInt(scrollY);
            let maxLength = Math.floor(bodyHeight / rowHeight);
            return maxLength;
        }
        //将table用行填充满
        _fillRows = (columns,dataList)=>{
            let maxLength = this._maxRowLength(this.fillRows.rowHeight);
            let fillTds = columns.map(_=>`<td>&nbsp;</td>`).join('');
            let fillTrs = '';
            for(let i=0;i < maxLength-dataList.length;i++){
                fillTrs += `<tr>${fillTds}</tr>`;
            }
            return fillTrs;
        }

        //如果出现垂直滚动条，（出现表头和表体两个table的情况），则需要根据条件是否要重新计算头部table的col值，以跟体部同样宽
        _createHeadcolGroup = () => {
            let {
                columns,
                hasScrollbar,
                scroll: {
                    x: scrollX,
                    y: scrollY
                }
            } = this;
            scrollX = parseInt(scrollX);
            //如果没有给出scrollX则不计算,没有scrollY也不计算
            if (!scrollX || !scrollY) {
                return false;
            }
            //计算给出的column总的width大小
            let colTotalWidth = 0;
            for (let i = 0; i < columns.length; i++) {
                //如果某个column没有width 则不需要分配了直接返回false
                if (!columns[i].width) {
                    return false;
                }
                //对width进行累加
                colTotalWidth += columns[i].width;
            }
            //如果给出的宽度 小于等于计算的宽度则不计算
            if (scrollX <= colTotalWidth) {
                return false;
            }

            //分配生成colgroup
            let ratio = scrollX / colTotalWidth;
            let cols = columns.map(item => {
                let width = Math.round(item.width * ratio);
                return `<col style="width:${width}px;min-width:${width}px" />`;
            }).join('');
        return `<colgroup>${cols} ${hasScrollbar ? '<col style="width:17px;min-width:17px;" />' : ''}</colgroup>`;
        }

        //通过dataIndex 获取数据对象
        getDataObj = (index)=>{
            let curPageDataList = this.dataList;
            //如果是传入的数据列表则需要根据分页来确定需要
            if(this.paginationObj && this.dataSource.data){
                let pageInfo = this.paginationObj.getStatus();
                let curPage = pageInfo.curPage;
                let pageSize = pageInfo.pageSize;
                curPageDataList = this.dataList.slice((curPage-1)*pageSize,curPage*pageSize);
            }
            return curPageDataList[+index];
        }

        //table行事件
        on = (eventType,callback)=>{
            let _this = this;
            if(eventType === 'row-click'){
                this.mountEl.addEventListener('click',function(ev){
                    let target = ev.target;
                    //找到目标target
                    while(target && target.nodeName.toUpperCase() !== 'TABLE'){
                        if(target.nodeName.toUpperCase() === 'TR'){
                            break;
                        }
                        target = target.parentNode;
                    }
                    //确定是目标元素
                    if(target?.nodeName?.toUpperCase() === 'TR'){
                        let index = target.dataset.index;
                        //调用回调函数，绑定this，传入event对象和当前行数据，
                        //ev可以用于实际用上的时候确定点击的是哪个元素
                        callback && callback.call(_this,ev,_this.getDataObj(index))
                    }
                })
            }
            
        }

        //获取表格中的loading对象
        getLoadingObj = ()=>{
            return this.loadingCompnent;
        }

        //通过表格显示loading
        showLoading = ()=>{
            this.loadingCompnent.show();
        }

        //通过表格隐藏loading
        hideLoading = ()=>{
            this.loadingCompnent.hide();
        }
    }

    var table = {};
    table.render = function (obj) {
        return new Table(obj);
    }
    window.table = table;
}(window);