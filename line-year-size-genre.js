function main() {
    let genres = ['Puzzle', 'Action', 'Adventure', 'Family', 'Board']
    let svg = d3.select('#line-year-size-genre'),
        margin = {top: 60, bottom: 60, left: 80, right: 160},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom,
        g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    let parseTime = d3.timeParse('%d/%m/%Y')

    let x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10)

    const makeLine = (xScale) => d3.line()
        .curve(d3.curveBasis)
        .x(function (d) {
            return xScale(d.time)
        })
        .y(function (d) {
            return y(d.average)
        })

    let line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) {
            return x(d.time)
        })
        .y(function (d) {
            return y(d.average)
        })

    d3.csv('appstore_games.csv', function (d) {
        return {
            year: parseTime(d['Original Release Date']).getFullYear(),
            sizeLog: Math.log10(+d['Size']),
            genre: d['Genres']
        }
    }).then(function (dataset) {
        let start = d3.min(dataset, d => d.year) + 1,
            end = d3.max(dataset, d => d.year) - 1

        let data = genres.map(function (id) {
            return {
                id: id,
                values: []
            }
        })
        data.forEach(function (elem) {
            for (let i = start; i <= end; i++) {
                elem.values.push({
                    time: Date.UTC(i, 0),
                    year: i,
                    count: 0,
                    total: 0,
                    average: 0})
            }
        })

        dataset.forEach(elem => {
            if (elem.year >= start && elem.year <= end && elem.sizeLog > 0) {
                genres.forEach(g => {
                    if (elem.genre.includes(g)) {
                        let entry = data.find(a => a.id === g).values
                            .find(v => v.year === elem.year)
                        entry.count++
                        entry.total += elem.sizeLog
                    }
                })
            }
        })
        data.forEach(function (elem) {
            elem.values = elem.values.filter(d => d.count !== 0)
            elem.values.forEach(d => d.average = Math.pow(10, d.total / d.count))
        })
        data.sort((a, b) =>
            b.values.find(d => d.year === end).average - a.values.find(d => d.year === end).average)
        console.log(data)

        x.domain([Date.UTC(start, 0) , Date.UTC(end, 1)])
        y.domain([
            10000000, 150000000
            // d3.min(data, d => d3.min(d.values, v => v.average)),
            // d3.max(data, d => d3.max(d.values, v => v.average))
        ])

        z.domain(data.map(function (c) {
            return c.id
        }))

        const x_axis = g.append('g')
            .attr('class', 'axis axis--x')
            .attr('id', 'x_axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x))

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2)
            .attr('y', - margin.left * 2 / 3)
            .attr('fill', '#000')
            .text('Size (geometrical average)')

        let city = g.selectAll('.city')
            .data(data)
            .enter().append('svg')
            .attr('class', 'city')
            .attr('id', d => 'city-' + d.id)
            .attr('width', width)

        const xAxis = (g, x) => g
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

        function zoomed(event) {
            let xz = event.transform.rescaleX(x)
            x_axis.call(xAxis, xz)
            city.selectAll('.line').attr('d', function (d) {
                return makeLine(xz)(d.values)
            })
        }

        const zoom = d3.zoom()
            .scaleExtent([1, 2])
            .extent([[margin.left, 0], [width, height]])
            .translateExtent([[margin.left, -Infinity], [width, Infinity]])
            .on('zoom', zoomed)

        svg.call(zoom)
            .transition()
            .duration(100)
            .call(zoom.scaleTo, 1, [x(Date.UTC(2012, 1, 1)), 0])


        city.append('path')
            .attr('class', 'line')
            .attr('d', function (d) {
                return line(d.values)
            })
            .attr('id', d => d.id)
            .attr('visibility', 'visible')
            .style('stroke', function (d) {
                return z(d.id)
            })

        let legend = d3.legendColor()
            .title('Color Legend')
            .scale(z)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 2) + ')')
            .call(legend)

        svg.selectAll('g.cell')
            .on('mouseover', hover)
            .on('mouseout', exit)
            .on('click', click)

        function hover(event, d) {
            let path = city.select('#' + d)
            if (path.attr('visibility') === 'hidden') {
                return
            }
            city.selectAll('.line').style('stroke', 'lightgrey')
            path.style('stroke', z(d))
            svg.select('#city-' + d).raise()
        }

        function exit() {
            city.selectAll('.line').style('stroke', d => z(d.id))
        }

        function click(event, d) {
            let path = city.select('#' + d)
            if (path.attr('visibility') === 'hidden') {
                path.attr('visibility', 'visible')
            } else {
                exit()
                path.attr('visibility', 'hidden')
            }
        }

    })
}

main()
