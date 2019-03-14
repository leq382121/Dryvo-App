import React, { Fragment } from "react"
import {
	View,
	Text,
	TouchableHighlight,
	StyleSheet,
	TouchableOpacity
} from "react-native"
import { connect } from "react-redux"
import { strings, dates } from "../../i18n"
import { Agenda } from "react-native-calendars"
import Separator from "../../components/Separator"
import {
	calendarTheme,
	MAIN_PADDING,
	API_DATE_FORMAT,
	SHORT_API_DATE_FORMAT,
	colors
} from "../../consts"
import Hours from "../../components/Hours"
import { getDateAndString } from "../../actions/lessons"
import LessonPopup from "../../components/LessonPopup"
import moment from "moment"

export class Schedule extends React.Component {
	static navigationOptions = () => {
		return {
			title: "schedule",
			tabBarLabel: strings("tabs.schedule"),
			tabBarAccessibilityLabel: strings("tabs.schedule"),
			tabBarTestID: "ScheduleTab"
		}
	}
	constructor(props) {
		super(props)
		const date = new Date()
		this.state = {
			selected: date.toJSON().slice(0, 10),
			items: {},
			visible: []
		}
		this._getItems(date)
		this.onDayPress = this.onDayPress.bind(this)
	}

	_getItems = async date => {
		const dates = getDateAndString(date)
		const resp = await this.props.fetchService.fetch(
			"/lessons/?date=ge:" +
				dates.date.startOf("day").toISOString() +
				"&date=le:" +
				dates.date.endOf("week").toISOString(),
			{ method: "GET" }
		)
		// get lessons until end of week and divide to array with date as key
		let items = {}
		resp.json["data"].forEach(lesson => {
			const dateString = moment
				.utc(lesson.date)
				.format(SHORT_API_DATE_FORMAT)
			if (items.hasOwnProperty(dateString)) {
				items[dateString].push(lesson)
			} else {
				items[dateString] = [lesson]
			}
		})
		this.setState(prevState => ({
			items: {
				...prevState.items,
				...items
			}
		}))
	}
	lessonPress = item => {
		let newVisible
		if (this.state.visible.includes(item.id)) {
			// we pop it
			newVisible = this.state.visible.filter((v, i) => v != item.id)
		} else {
			newVisible = [...this.state.visible, item.id]
		}
		this.setState({ visible: newVisible })
	}

	renderItem = (item, firstItemInDay) => {
		let dayTitle
		if (firstItemInDay) {
			dayTitle = (
				<Fragment>
					<Separator />
					<Text style={styles.dayTitle}>
						{dates("date.formats.short", item.date)}
					</Text>
				</Fragment>
			)
		}
		const date = item.date
		let meetup = strings("not_set")
		if (item.meetup_place) meetup = item.meetup_place.name
		let dropoff = strings("not_set")
		if (item.dropoff_place) dropoff = item.dropoff_place.name
		const visible = this.state.visible.includes(item.id) ? true : false
		let approved
		if (!item.is_approved) {
			approved = (
				<Text style={{ color: "red" }}>
					({strings("not_approved")})
				</Text>
			)
		}
		return (
			<Fragment>
				{dayTitle}
				<View style={styles.lesson}>
					<TouchableOpacity onPress={() => this.lessonPress(item)}>
						<Text style={styles.lessonTitle}>
							{strings("teacher.home.lesson_number")}{" "}
							{item.lesson_number} {approved}
						</Text>
						<Hours
							duration={item.duration}
							date={date}
							style={styles.hours}
						/>
						<Text style={styles.places}>
							{strings("teacher.new_lesson.meetup")}: {meetup},{" "}
							{strings("teacher.new_lesson.dropoff")}: {dropoff}
						</Text>
					</TouchableOpacity>
				</View>
				<LessonPopup
					visible={visible}
					item={item}
					onPress={this.lessonPress}
					onButtonPress={() => {
						this.lessonPress(item)
						this.props.navigation.navigate("Lesson", {
							lesson: item
						})
					}}
					navigation={this.props.navigation}
				/>
			</Fragment>
		)
	}

	renderEmpty = () => {
		return <Text>Hello empty</Text>
	}

	onDayPress = day => {
		this.setState(
			{
				selected: day.dateString
			},
			() => {
				this._getItems(day)
			}
		)
	}

	render() {
		return (
			<View style={styles.container}>
				<View testID="ScheduleView" style={styles.schedule}>
					<Agenda
						items={this.state.items}
						// callback that gets called on day press
						onDayPress={this.onDayPress}
						onDayChange={this.onDayPress}
						// initially selected day
						selected={Date()}
						// Max amount of months allowed to scroll to the past. Default = 50
						pastScrollRange={50}
						// Max amount of months allowed to scroll to the future. Default = 50
						futureScrollRange={50}
						// specify how each item should be rendered in agenda
						renderItem={this.renderItem}
						// specify how each date should be rendered. day can be undefined if the item is not first in that day.
						renderDay={() => undefined}
						renderEmptyDate={this.renderEmpty}
						// specify your item comparison function for increased performance
						rowHasChanged={(r1, r2) => {
							return r1.text !== r2.text || this.state.visible
						}}
						markedDates={{
							[this.state.selected]: {
								selected: true
							}
						}}
						// agenda theme
						theme={{
							...calendarTheme,
							backgroundColor: "transparent",
							agendaKnobColor: "gray",
							textWeekDayFontSize: 16,
							textWeekDayFontWeight: "600"
						}}
					/>
				</View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	calendar: {
		flex: 1
	},
	schedule: {
		flex: 1,
		paddingRight: MAIN_PADDING,
		paddingLeft: MAIN_PADDING,
		marginTop: 20
	},
	lesson: {
		flex: 1,
		marginTop: 12,
		backgroundColor: "#f4f4f4",
		padding: 8
	},
	dayTitle: {
		fontWeight: "bold",
		alignSelf: "flex-start",
		marginBottom: 8
	},
	lessonTitle: {
		color: colors.blue,
		alignSelf: "flex-start"
	},
	places: {
		fontSize: 14,
		color: "gray",
		marginTop: 4,
		alignSelf: "flex-start"
	},
	hours: {
		fontSize: 14,
		color: "gray",
		alignSelf: "flex-start"
	},
	userWithPic: { marginLeft: 10 }
})

function mapStateToProps(state) {
	return {
		fetchService: state.fetchService
	}
}
export default connect(mapStateToProps)(Schedule)
