require 'uri'
require 'net/http'

class OsoClient
  def self.reset_timer
    @@duration = 0
  end

  def self.get_duration
    @@duration
  end

  class Expression
    attr_accessor :type, :operator, :args, :name, :value
    def self.from_json(json)
      expr = Expression.new
      unless json.is_a? Hash
        expr.type = :value
        expr.value = json
        return expr
      end
      if json["operator"]
        expr.type = :expression
        expr.operator = json["operator"].downcase.to_sym
        expr.args = json["args"].map{|arg| self.from_json(arg)}
      elsif json["name"]
        expr.type = :variable
        expr.name = json["name"]
      else
        expr.type = :value
        expr.value = json
      end
      expr
    end

    def to_s
      case type
      when :variable
        return "VAR(#{name})"
      when :value
        return "VALUE(#{value})"
      when :expression
        return args.map(&:to_s).join(" #{operator} ")
      end
    end

    # If we bind variables with bindigns, what does this expression return?
    def to_value(bindings)
      case type
      when :variable
        return bindings[name]
      when :value
        return value
      when :expression
        case operator
        when :in
          list = args[1].to_value(bindings)
          raise "Invalid in expression: #{self}" unless list.is_a? Array
          return list.include? args[0].to_value(bindings)
        when :unify
          return args[1].to_value(bindings) == args[0].to_value(bindings)
        when :and
          return args.map{|arg| arg.to_value(bindings)}.all?
        when :dot
          # Unsafe alert
          return args[0].to_value(bindings).send(args[1].to_value(bindings))
        end
      end
      return false
    end
  end

  def self.is_allowed(user, action, resource)
    start = Time.now
    results = self.authorize_req(user, action, resource)
    @@duration += (Time.now - start) * 1000.0
    results.each do |result|
      return true if result.to_value({ "_this" => resource })
    end
    return false
  end

  def self.authorize(user, action, resource)
    raise Oso::NotFoundError unless self.is_allowed(user, action, resource)
  end

  private

  def self.authorize_req(user, action, resource)
    uri = URI("http://localhost:5002/authorize/User/#{user.id}/#{action}/#{resource.class.to_s}/#{resource.id}")
    res = Net::HTTP.get_response(uri)
    return JSON.parse(res.body).map{|json| Expression.from_json(json["resource"])} if res.is_a?(Net::HTTPSuccess)
    return nil
  end
end
